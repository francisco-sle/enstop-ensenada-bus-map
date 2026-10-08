// ─────────────────────────────────────────────────────────────────────────────
// Builds the demo bus network from network.config.mjs.
//
//   node ui/src/mocks/scripts/build_network.mjs
//
// 1. Road-snaps every route loop through the public OSRM demo server.
// 2. Projects each stop onto its route in travel order (so a stop on a street
//    the loop uses twice lands on the correct pass) and inserts it as a vertex.
// 3. Verifies the client's nearest-vertex alignment (useRoutes.ts) recovers
//    every stop in sequence order.
// 4. Writes ui/src/mocks/data/*.json and supabase/seed.sql.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as prettier from 'prettier'
import { brands, categories, fareSchedule, routes, stops } from './network.config.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '../data')
const seedPath = path.resolve(__dirname, '../../../../supabase/seed.sql')

const CREATED_AT = '2026-06-01T00:00:00Z'
const FARES_EFFECTIVE_FROM = '2025-01-01'
const FARES_UPDATED_AT = '2026-06-22T00:00:00Z'

// Max distance (m) between a stop's configured `at` and its route geometry.
const MAX_SNAP_M = 60
// Max distance (m) between an already-placed shared stop and another route.
const MAX_SHARED_SNAP_M = 10
// Must match the threshold in useRoutes.ts.
const CLIENT_MAX_STOP_DISTANCE_M = 150

// ── Geometry helpers (local equirectangular metres, fine at city scale) ──────

const M_PER_DEG_LAT = 111_000
const M_PER_DEG_LNG = 94_000 // at ~31.8°N, same factor useRoutes.ts uses

const toXY = ([lng, lat]) => [lng * M_PER_DEG_LNG, lat * M_PER_DEG_LAT]
const round6 = (n) => Math.round(n * 1e6) / 1e6

function projectOnSegment(p, a, b) {
  const [px, py] = toXY(p)
  const [ax, ay] = toXY(a)
  const [bx, by] = toXY(b)
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
  const x = ax + t * dx
  const y = ay + t * dy
  return {
    t,
    dist: Math.hypot(px - x, py - y),
    point: [round6(x / M_PER_DEG_LNG), round6(y / M_PER_DEG_LAT)],
  }
}

const distM = (p, q) => {
  const [px, py] = toXY(p)
  const [qx, qy] = toXY(q)
  return Math.hypot(px - qx, py - qy)
}

/**
 * Finds the first pass of `coords` (from vertex `fromIdx` on) that comes within
 * `maxDist` of `p`, and returns the closest projection within that pass.
 */
function projectForward(p, coords, fromIdx, maxDist) {
  let best = null
  for (let i = fromIdx; i < coords.length - 1; i++) {
    const proj = projectOnSegment(p, coords[i], coords[i + 1])
    if (proj.dist <= maxDist) {
      if (!best || proj.dist < best.dist) best = { ...proj, seg: i }
    } else if (best) {
      break // left the first matching pass
    }
  }
  return best
}

/** Inserts `point` after vertex `seg` unless it already coincides with an endpoint. */
function insertVertex(coords, seg, point) {
  if (distM(point, coords[seg]) < 0.5) return seg
  if (distM(point, coords[seg + 1]) < 0.5) return seg + 1
  coords.splice(seg + 1, 0, point)
  return seg + 1
}

// ── OSRM ─────────────────────────────────────────────────────────────────────

async function fetchLoopGeometry(route) {
  const coords = route.waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';')
  const bearings = route.waypoints.map((w) => (w[2] != null ? `${w[2]},40` : '')).join(';')
  const url =
    `https://router.project-osrm.org/route/v1/driving/${coords}` +
    `?overview=full&geometries=geojson&continue_straight=true&bearings=${bearings}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM ${route.short_name}: HTTP ${res.status}`)
  const data = await res.json()
  if (data.code !== 'Ok') throw new Error(`OSRM ${route.short_name}: ${data.code} ${data.message}`)

  const line = data.routes[0].geometry.coordinates.map(([lng, lat]) => [round6(lng), round6(lat)])
  // Drop consecutive duplicates OSRM emits at waypoints.
  return line.filter((c, i) => i === 0 || distM(c, line[i - 1]) > 0.05)
}

// ── Client alignment check (mirrors useRoutes.ts) ────────────────────────────

function clientCoordIndex(coords, stopCoord) {
  let minSq = Infinity
  let bestIdx = 0
  for (let i = 0; i < coords.length; i++) {
    const dx = (coords[i][0] - stopCoord[0]) * M_PER_DEG_LNG
    const dy = (coords[i][1] - stopCoord[1]) * M_PER_DEG_LAT
    const sq = dx * dx + dy * dy
    if (sq < minSq) {
      minSq = sq
      bestIdx = i
    }
  }
  return { idx: bestIdx, dist: Math.sqrt(minSq) }
}

// ── Build ────────────────────────────────────────────────────────────────────

async function build() {
  const stopIds = new Map() // key → numeric id, assigned in order of first use
  const stopCoords = new Map() // key → [lng, lat] fixed by the first route that serves it
  const routeRows = []
  const routeStopRows = []
  const errors = []

  for (const route of routes) {
    const coords = await fetchLoopGeometry(route)
    const placed = []
    let cursor = 0

    for (const [seqIdx, key] of route.stops.entries()) {
      const stop = stops[key]
      if (!stop) throw new Error(`${route.short_name}: unknown stop "${key}"`)

      const shared = stopCoords.get(key)
      const target = shared ?? [stop.at[1], stop.at[0]]
      const proj = projectForward(target, coords, cursor, shared ? MAX_SHARED_SNAP_M : MAX_SNAP_M)
      if (!proj) {
        errors.push(
          `${route.short_name} #${seqIdx + 1} ${key}: no pass within range after vertex ${cursor}`,
        )
        continue
      }

      if (!shared) stopCoords.set(key, proj.point)
      if (!stopIds.has(key)) stopIds.set(key, stopIds.size + 1)

      cursor = insertVertex(coords, proj.seg, shared ?? proj.point)
      placed.push({ key, sequence: seqIdx + 1, vertex: cursor })
    }

    // Close the loop exactly on the first stop.
    coords[coords.length - 1] = [...coords[0]]

    for (const p of placed) {
      const { idx, dist } = clientCoordIndex(coords, stopCoords.get(p.key))
      if (dist > CLIENT_MAX_STOP_DISTANCE_M) {
        errors.push(`${route.short_name} ${p.key}: ${dist.toFixed(0)} m from route`)
      }
      p.clientIdx = idx
    }
    for (let i = 1; i < placed.length; i++) {
      if (placed[i].clientIdx <= placed[i - 1].clientIdx) {
        errors.push(
          `${route.short_name}: client aligns ${placed[i].key} (seq ${placed[i].sequence}) at vertex ` +
            `${placed[i].clientIdx}, not after ${placed[i - 1].key} (${placed[i - 1].clientIdx})`,
        )
      }
    }

    const { waypoints: _w, stops: _s, ...meta } = route
    routeRows.push({
      ...meta,
      geom: { type: 'LineString', coordinates: coords },
      direction: 'circular',
      is_active: true,
      created_at: CREATED_AT,
    })
    for (const p of placed) {
      routeStopRows.push({
        id: routeStopRows.length + 1,
        route_id: route.id,
        stop_id: stopIds.get(p.key),
        sequence: p.sequence,
      })
    }

    const km = coords.slice(1).reduce((acc, c, i) => acc + distM(c, coords[i]), 0) / 1000
    console.log(
      `${route.short_name}: ${km.toFixed(1)} km, ${coords.length} vertices, ${placed.length} stops`,
    )
  }

  if (errors.length) {
    console.error(`\n${errors.length} validation error(s):\n  ${errors.join('\n  ')}`)
    process.exit(1)
  }

  const stopRows = [...stopIds.entries()].map(([key, id]) => {
    const { name, common_name, is_terminal, accessible } = stops[key]
    return {
      id,
      name,
      common_name,
      geom: { type: 'Point', coordinates: stopCoords.get(key) },
      is_terminal,
      accessible,
      created_at: CREATED_AT,
    }
  })

  const unused = Object.keys(stops).filter((k) => !stopIds.has(k))
  if (unused.length) console.warn(`Unused stops in config: ${unused.join(', ')}`)

  const fareRows = routes
    .flatMap((route) =>
      fareSchedule.map((f) => ({
        route_id: route.id,
        passenger_type: f.passenger_type,
        fare_mxn: f.fare_mxn,
        effective_from: FARES_EFFECTIVE_FROM,
        notes: f.notes,
        updated_at: FARES_UPDATED_AT,
      })),
    )
    .map((f, i) => ({ id: i + 1, ...f }))

  // Format like the rest of the repo so `prettier --check` stays green.
  const writeJson = async (file, data) => {
    const filepath = path.join(dataDir, file)
    const options = await prettier.resolveConfig(filepath)
    const json = await prettier.format(JSON.stringify(data), { ...options, filepath })
    fs.writeFileSync(filepath, json, 'utf8')
  }

  await writeJson('routes.json', routeRows)
  await writeJson('stops.json', stopRows)
  await writeJson('route_stops.json', routeStopRows)
  await writeJson('fares.json', fareRows)
  await writeJson('brands.json', brands)
  await writeJson('categories.json', categories)

  fs.writeFileSync(seedPath, buildSeedSql(routeRows, stopRows, routeStopRows, fareRows), 'utf8')

  console.log(
    `\nWrote ${stopRows.length} stops, ${routeStopRows.length} route_stops, ${fareRows.length} fares.`,
  )
}

// ── seed.sql ─────────────────────────────────────────────────────────────────

const sql = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)

function buildSeedSql(routeRows, stopRows, routeStopRows, fareRows) {
  const lineWkt = (coords) =>
    `LINESTRING(${coords.map(([lng, lat]) => `${lng} ${lat}`).join(', ')})`

  return `-- Generated by ui/src/mocks/scripts/build_network.mjs — do not edit by hand.
-- Demo network: routes follow real Ensenada corridors but are not official itineraries.

-- Clean slate
TRUNCATE categories, brands, routes, stops, route_stops, fare_rules RESTART IDENTITY CASCADE;

-- Insert categories
INSERT INTO categories (id, name, color_hex) VALUES
${categories.map((c) => `(${c.id}, ${sql(c.name)}, ${sql(c.color_hex)})`).join(',\n')};

-- Insert brands
INSERT INTO brands (id, name, color_hex, units_operating) VALUES
${brands.map((b) => `(${b.id}, ${sql(b.name)}, ${sql(b.color_hex)}, ${b.units_operating})`).join(',\n')};

-- Insert routes
INSERT INTO routes (id, name, short_name, category_id, brand_id, description, geom, direction, is_active) VALUES
${routeRows
  .map(
    (r) =>
      `(${r.id}, ${sql(r.name)}, ${sql(r.short_name)}, ${r.category_id}, ${r.brand_id}, ${sql(r.description)},\n` +
      `  ST_GeomFromText('${lineWkt(r.geom.coordinates)}', 4326),\n  ${sql(r.direction)}, ${r.is_active})`,
  )
  .join(',\n')};

-- Insert stops
INSERT INTO stops (id, name, common_name, geom, is_terminal, accessible) VALUES
${stopRows
  .map(
    (s) =>
      `(${s.id}, ${sql(s.name)}, ${sql(s.common_name)}, ` +
      `ST_SetSRID(ST_MakePoint(${s.geom.coordinates[0]}, ${s.geom.coordinates[1]}), 4326), ` +
      `${s.is_terminal}, ${s.accessible})`,
  )
  .join(',\n')};

-- Insert route_stops (sequence = travel order along each loop)
INSERT INTO route_stops (id, route_id, stop_id, sequence) VALUES
${routeStopRows.map((rs) => `(${rs.id}, ${rs.route_id}, ${rs.stop_id}, ${rs.sequence})`).join(',\n')};

-- Insert fare_rules
INSERT INTO fare_rules (id, route_id, passenger_type, fare_mxn, effective_from, notes) VALUES
${fareRows
  .map(
    (f) =>
      `(${f.id}, ${f.route_id}, ${sql(f.passenger_type)}, ${f.fare_mxn.toFixed(2)}, ${sql(f.effective_from)}, ${sql(f.notes)})`,
  )
  .join(',\n')};

-- Explicit ids were inserted above; move each sequence past them.
SELECT setval(pg_get_serial_sequence('categories', 'id'), (SELECT MAX(id) FROM categories));
SELECT setval(pg_get_serial_sequence('brands', 'id'), (SELECT MAX(id) FROM brands));
SELECT setval(pg_get_serial_sequence('routes', 'id'), (SELECT MAX(id) FROM routes));
SELECT setval(pg_get_serial_sequence('stops', 'id'), (SELECT MAX(id) FROM stops));
SELECT setval(pg_get_serial_sequence('route_stops', 'id'), (SELECT MAX(id) FROM route_stops));
SELECT setval(pg_get_serial_sequence('fare_rules', 'id'), (SELECT MAX(id) FROM fare_rules));
`
}

build().catch((err) => {
  console.error(err)
  process.exit(1)
})
