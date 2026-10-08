import { describe, it, expect } from 'vitest'
import { distance, length, lineString } from '@turf/turf'
import { alignStopsToGeometry, computeABRoute } from '../components/Routing/routing'
import type { DBStop, RouteDetail } from '../types'
import routesData from './data/routes.json'
import stopsData from './data/stops.json'
import routeStopsData from './data/route_stops.json'
import brandsData from './data/brands.json'
import categoriesData from './data/categories.json'

// Integrity checks for the generated demo network (build_network.mjs): every
// stop must survive the client's geometry alignment in sequence order, or the
// route planner silently drops / mis-slices it.

const stops = stopsData as unknown as DBStop[]
const stopById = new Map(stops.map((s) => [s.id, s]))
// Opposite-direction pairs share a name; common_name tells them apart.
const findStop = (name: string, commonName?: string) => {
  const matches = stops.filter(
    (s) => s.name === name && (commonName === undefined || s.common_name === commonName),
  )
  if (matches.length !== 1) throw new Error(`${matches.length} stops match "${name}"`)
  return matches[0]
}

// Same shape useRoutes() produces: sorted route_stops with coord_index assigned.
const routes: RouteDetail[] = routesData.map((route) => {
  const coords = route.geom.coordinates as [number, number][]
  const routeStops = routeStopsData
    .filter((rs) => rs.route_id === route.id)
    .sort((a, b) => a.sequence - b.sequence)
    .map((rs) => ({ ...rs, stop: stopById.get(rs.stop_id)! }))
  return {
    ...route,
    category: categoriesData.find((c) => c.id === route.category_id) ?? null,
    brand: { ...brandsData.find((b) => b.id === route.brand_id)!, created_at: '' },
    route_stops: alignStopsToGeometry(routeStops, coords, route.name),
  } as RouteDetail
})

const routeLengthKm = (route: RouteDetail) =>
  length(lineString(route.geom.coordinates), { units: 'kilometers' })

/** Best planner results for a trip from stop `o` to stop `d` over `candidates`. */
function plan(o: DBStop, d: DBStop, candidates: RouteDetail[] = routes) {
  const [oLng, oLat] = o.geom.coordinates
  const [dLng, dLat] = d.geom.coordinates
  return computeABRoute(oLat, oLng, dLat, dLng, [o], [d], candidates)
}

describe('demo network data', () => {
  it('references only existing routes and stops with contiguous sequences', () => {
    for (const route of routesData) {
      const seqs = routeStopsData
        .filter((rs) => rs.route_id === route.id)
        .map((rs) => rs.sequence)
        .sort((a, b) => a - b)
      expect(seqs).toEqual(seqs.map((_, i) => i + 1))
    }
    for (const rs of routeStopsData) {
      expect(stopById.has(rs.stop_id)).toBe(true)
      expect(routesData.some((r) => r.id === rs.route_id)).toBe(true)
    }
  })

  it.each(routes.map((r) => [r.short_name, r] as const))(
    '%s is a closed loop starting at its first stop',
    (_, route) => {
      const coords = route.geom.coordinates
      expect(coords[0]).toEqual(coords[coords.length - 1])
      expect(route.route_stops[0].coord_index).toBe(0)
    },
  )

  it.each(routes.map((r) => [r.short_name, r] as const))(
    '%s keeps every stop, aligned in sequence order',
    (_, route) => {
      const expected = routeStopsData.filter((rs) => rs.route_id === route.id).length
      expect(route.route_stops).toHaveLength(expected)

      const indices = route.route_stops.map((rs) => rs.coord_index!)
      for (let i = 1; i < indices.length; i++) {
        expect(indices[i]).toBeGreaterThan(indices[i - 1])
      }
    },
  )

  it.each(routes.map((r) => [r.short_name, r] as const))(
    '%s can ride from its first stop to every other stop along the loop',
    (_, route) => {
      const total = routeLengthKm(route)
      const [first, ...rest] = route.route_stops
      for (const rs of rest) {
        const [result] = plan(first.stop, rs.stop, [route])
        expect(result, `${first.stop.name} → ${rs.stop.name}`).toBeDefined()

        const straightKm = distance(first.stop.geom.coordinates, rs.stop.geom.coordinates, {
          units: 'kilometers',
        })
        expect(result.busDistanceKm).toBeGreaterThanOrEqual(straightKm * 0.99)
        expect(result.busDistanceKm).toBeLessThanOrEqual(total)
      }
    },
  )
})

describe('demo network trips', () => {
  it.each([
    ['Terminal Centro', 'Terminal Chapultepec', 'R1'],
    ['Terminal Centro', 'Terminal Maneadero', 'R2'],
    ['Terminal Centro', 'Terminal El Sauzal', 'R3'],
    ['Terminal Centro', 'Terminal Popular 89', 'R4'],
    ['Terminal Centro', 'Blvd. Zertuche y Blvd. de los Lagos', 'R5'],
  ])('%s → %s is served by %s', (from, to, shortName) => {
    const results = plan(findStop(from), findStop(to))
    expect(results.map((r) => r.routeShortName)).toContain(shortName)
  })

  it('offers every Reforma corridor route at a shared northbound stop', () => {
    const results = plan(
      findStop('Av. Reforma y Calle Granada'),
      findStop('Calle Octava y Av. Espinoza'),
    )
    expect(results.map((r) => r.routeShortName).sort()).toEqual(['R1', 'R2', 'R5'])
  })

  it('rides a short hop forward instead of around the loop', () => {
    // Opposite-carriageway pairs share a cross street; the planner must pick the
    // southbound stop's own pass, not the northbound one ~17 m away.
    const [result] = plan(
      findStop('Av. Reforma y Blvd. Estancia', 'Col. Acapulco → Sur'),
      findStop('Av. Reforma y Av. Las Palmas'),
    )
    expect(result.routeShortName).toBe('R1')
    expect(result.busDistanceKm).toBeLessThan(1)
  })
})
