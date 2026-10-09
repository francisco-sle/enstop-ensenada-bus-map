import baseStops from './stops.json'
import baseRoutes from './routes.json'
import baseRouteStops from './route_stops.json'

// ─────────────────────────────────────────────────────────────────────────────
// Mock network served by the MSW handlers.
//
// `?stress=<n>` (remembered in sessionStorage, `?stress=0` clears it) grows the
// demo network to roughly `n` stops so map clutter and render cost can be
// evaluated at production scale. Synthetic routes are out-and-back walks along a
// ~110 m street grid, starting from points on the real routes, with a stop every
// ~230 m on each curb. Stops closer than 30 m are shared, creating transfer points.
// Generation is seeded, so the same `n` always yields the same network.
// ─────────────────────────────────────────────────────────────────────────────

type Stop = (typeof baseStops)[number]
type Route = (typeof baseRoutes)[number]
type RouteStop = (typeof baseRouteStops)[number]

const STORAGE_KEY = 'enstop:stress'

function readStressCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    const param = new URLSearchParams(window.location.search).get('stress')
    if (param !== null) sessionStorage.setItem(STORAGE_KEY, param)
    return Math.max(0, parseInt(sessionStorage.getItem(STORAGE_KEY) ?? '0', 10) || 0)
  } catch {
    return 0
  }
}

// Deterministic PRNG (mulberry32)
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const M_PER_DEG_LAT = 111_320
const M_PER_DEG_LNG = 111_320 * Math.cos((31.86 * Math.PI) / 180)
const BLOCK_M = 110
const STOP_SPACING_M = 230
const SHARE_RADIUS_M = 30
const CURB_OFFSET_M = 8

function lineCoords(geom: unknown): [number, number][] {
  const g = geom as { type: string; coordinates: unknown }
  if (g?.type === 'LineString') return g.coordinates as [number, number][]
  if (g?.type === 'MultiLineString') return (g.coordinates as [number, number][][]).flat()
  return []
}

function buildStressNetwork(target: number) {
  const random = rng(target)
  const stops: Stop[] = [...baseStops]
  const routes: Route[] = [...baseRoutes]
  const routeStops: RouteStop[] = [...baseRouteStops]
  let nextStopId = Math.max(...stops.map((s) => s.id)) + 1
  let nextRouteId = Math.max(...routes.map((r) => r.id)) + 1
  let nextRsId = Math.max(...routeStops.map((rs) => rs.id)) + 1

  // Spatial hash for stop sharing
  const cellKey = (x: number, y: number) =>
    `${Math.floor(x / SHARE_RADIUS_M)}:${Math.floor(y / SHARE_RADIUS_M)}`
  const grid = new Map<string, Stop[]>()
  const toMeters = (lng: number, lat: number) => [lng * M_PER_DEG_LNG, lat * M_PER_DEG_LAT]
  const indexStop = (stop: Stop) => {
    const [x, y] = toMeters(stop.geom.coordinates[0], stop.geom.coordinates[1])
    const key = cellKey(x, y)
    grid.set(key, [...(grid.get(key) ?? []), stop])
  }
  const findNearby = (lng: number, lat: number): Stop | null => {
    const [x, y] = toMeters(lng, lat)
    const cx = Math.floor(x / SHARE_RADIUS_M)
    const cy = Math.floor(y / SHARE_RADIUS_M)
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (const s of grid.get(`${cx + dx}:${cy + dy}`) ?? []) {
          const [sx, sy] = toMeters(s.geom.coordinates[0], s.geom.coordinates[1])
          if (Math.hypot(sx - x, sy - y) < SHARE_RADIUS_M) return s
        }
    return null
  }
  stops.forEach(indexStop)

  // Land mask: coastal roads are routed, so nothing west of the westernmost
  // route vertex in each ~1 km latitude band is land; east, stay near the city.
  const baseCoords = baseRoutes.flatMap((r) => lineCoords(r.geom))
  const band = (lat: number) => Math.round(lat * 100)
  const westEdge = new Map<number, number>()
  const eastEdge = new Map<number, number>()
  for (const [lng, lat] of baseCoords) {
    westEdge.set(band(lat), Math.min(westEdge.get(band(lat)) ?? Infinity, lng))
    eastEdge.set(band(lat), Math.max(eastEdge.get(band(lat)) ?? -Infinity, lng))
  }
  const onLand = (lng: number, lat: number) =>
    lng > (westEdge.get(band(lat)) ?? Infinity) + 0.001 &&
    lng < (eastEdge.get(band(lat)) ?? -Infinity) + 0.015

  // Out-and-back walk along the street grid
  const walk = (): [number, number][] => {
    const start = baseCoords[Math.floor(random() * baseCoords.length)]
    const path: [number, number][] = [start]
    const lengthM = 4000 + random() * 6000
    let dir = Math.floor(random() * 4)
    let travelled = 0
    let [lng, lat] = start
    while (travelled < lengthM) {
      const blocks = 2 + Math.floor(random() * 10)
      const [dx, dy] = [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ][dir]
      let moved = 0
      for (let b = 0; b < blocks; b++) {
        const nLng = lng + (dx * BLOCK_M) / M_PER_DEG_LNG
        const nLat = lat + (dy * BLOCK_M) / M_PER_DEG_LAT
        if (!onLand(nLng, nLat)) break
        lng = nLng
        lat = nLat
        moved++
        // A vertex per block: the app aligns stops to the nearest vertex
        path.push([lng, lat])
      }
      travelled += Math.max(moved, 1) * BLOCK_M
      dir = (dir + (random() < 0.5 ? 1 : 3)) % 4
    }
    return [...path, ...path.slice(0, -1).reverse()]
  }

  while (stops.length < target) {
    const coords = walk()
    if (coords.length < 4) continue
    const routeId = nextRouteId++
    const template = baseRoutes[routeId % baseRoutes.length]
    routes.push({
      ...template,
      id: routeId,
      short_name: `S${routeId}`,
      name: `Ruta sintética ${routeId}`,
      description: 'Ruta generada para pruebas de carga (modo estrés).',
      geom: { type: 'LineString', coordinates: coords },
    } as Route)

    let sequence = 1
    const served = new Set<number>()
    const serve = (stop: Stop) => {
      if (served.has(stop.id)) return
      served.add(stop.id)
      routeStops.push({
        id: nextRsId++,
        route_id: routeId,
        stop_id: stop.id,
        sequence: sequence++,
      } as RouteStop)
    }

    let untilNext = STOP_SPACING_M * random()
    for (let i = 0; i < coords.length - 1; i++) {
      const [x1, y1] = coords[i]
      const [x2, y2] = coords[i + 1]
      const ex = (x2 - x1) * M_PER_DEG_LNG
      const ey = (y2 - y1) * M_PER_DEG_LAT
      const len = Math.hypot(ex, ey)
      if (len === 0) continue
      let at = untilNext
      while (at <= len) {
        const t = at / len
        // Right-hand curb of the travel direction
        const lng = x1 + (x2 - x1) * t + ((ey / len) * CURB_OFFSET_M) / M_PER_DEG_LNG
        const lat = y1 + (y2 - y1) * t - ((ex / len) * CURB_OFFSET_M) / M_PER_DEG_LAT
        let stop = findNearby(lng, lat)
        if (!stop) {
          const id = nextStopId++
          stop = {
            id,
            name: `Parada ${id}`,
            common_name: 'Parada sintética (modo estrés)',
            geom: { type: 'Point', coordinates: [+lng.toFixed(6), +lat.toFixed(6)] },
            is_terminal: false,
            accessible: random() < 0.25,
            created_at: '2026-06-01T00:00:00Z',
          }
          stops.push(stop)
          indexStop(stop)
        }
        serve(stop)
        at += STOP_SPACING_M * (0.85 + random() * 0.3)
      }
      untilNext = at - len
    }
  }

  return { stops, routes, routeStops }
}

const stressCount = readStressCount()
const network =
  stressCount > baseStops.length
    ? buildStressNetwork(stressCount)
    : { stops: baseStops, routes: baseRoutes, routeStops: baseRouteStops }

if (stressCount > 0) {
  console.warn(
    `[mocks] stress mode: ${network.stops.length} stops, ${network.routes.length} routes`,
  )
}

export const stopsData: Stop[] = network.stops
export const routesData: Route[] = network.routes
export const routeStopsData: RouteStop[] = network.routeStops
