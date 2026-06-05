import { length, distance, point, lineString } from '@turf/turf'
import type { DBStop, RouteDetail, RoutingResult } from '../../types'

// Constants
const BUS_SPEED_KMH = 20
const WALK_SPEED_KMH = 5

/**
 * Find the index of the route coordinate closest to the given [lng, lat] stop position.
 * This is more reliable than turf's lineSlice projection, which can snap to the wrong
 * leg of a circular route when both legs run through the same area.
 */
function nearestCoordIndex(routeCoords: [number, number][], stopLng: number, stopLat: number): number {
  let minDistSq = Infinity
  let minIdx = 0
  for (let i = 0; i < routeCoords.length; i++) {
    const dx = routeCoords[i][0] - stopLng
    const dy = routeCoords[i][1] - stopLat
    const distSq = dx * dx + dy * dy
    if (distSq < minDistSq) {
      minDistSq = distSq
      minIdx = i
    }
  }
  return minIdx
}

/**
 * Computes up to 3 optimal A→B transit routes given nearby candidate stops and
 * pre-fetched route geometry. Handles both forward and circular (backward-wrap)
 * route directions.
 *
 * @param originLat - Latitude of the trip origin point.
 * @param originLng - Longitude of the trip origin point.
 * @param destLat   - Latitude of the trip destination point.
 * @param destLng   - Longitude of the trip destination point.
 * @param nearbyOriginStops - Candidate boarding stops near the origin (from `getNearbyStops`).
 * @param nearbyDestStops   - Candidate alighting stops near the destination (from `getNearbyStops`).
 * @param routesDetails     - Pre-fetched `RouteDetail[]` that must include `route_stops` and `geom`.
 * @returns Up to 3 `RoutingResult` objects sorted ascending by `totalMinutes`.
 *
 * @example
 * const oNearby = getNearbyStops(31.86, -116.60, allStops, 2.0)
 * const dNearby = getNearbyStops(31.83, -116.62, allStops, 2.0)
 * const results = computeABRoute(31.86, -116.60, 31.83, -116.62, oNearby, dNearby, [route1Detail])
 * // results[0].totalMinutes — fastest option in minutes
 * // results[0].subPolylineCoords — [lat, lng][] for the bus segment Polyline
 */
export function computeABRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  nearbyOriginStops: DBStop[],
  nearbyDestStops: DBStop[],
  routesDetails: RouteDetail[] // pre-fetched details for routes
): RoutingResult[] {
  const results: RoutingResult[] = []

  const originPt = point([originLng, originLat])
  const destPt = point([destLng, destLat])

  // For each combination of origin stop and destination stop
  for (const originStop of nearbyOriginStops) {
    const originStopLng = originStop.geom.coordinates[0]
    const originStopLat = originStop.geom.coordinates[1]
    const originStopPt = point([originStopLng, originStopLat])

    for (const destStop of nearbyDestStops) {
      // Don't route to the same stop
      if (originStop.id === destStop.id) continue

      const destStopLng = destStop.geom.coordinates[0]
      const destStopLat = destStop.geom.coordinates[1]
      const destStopPt = point([destStopLng, destStopLat])

      // Find routes that serve both stops
      for (const route of routesDetails) {
        const routeStops = route.route_stops || []
        const originRS = routeStops.find(rs => rs.stop_id === originStop.id)
        const destRS = routeStops.find(rs => rs.stop_id === destStop.id)

        // Route must serve both stops
        if (!originRS || !destRS) continue

        // Validate sequence direction:
        // For circular routes, we can travel backwards via the loop (sequence N -> 1)
        // For inbound/outbound, we must go forward (origin sequence < dest sequence)
        const isCircular = route.direction === 'circular'
        const goesForward = originRS.sequence < destRS.sequence

        if (!goesForward && !isCircular) {
          continue
        }

        try {
          const routeCoords = route.geom.coordinates as [number, number][]

          // Find the route coordinate index closest to each stop.
          // Index-based slicing avoids lineSlice's nearest-on-line projection, which can
          // incorrectly snap to the wrong leg on circular/bidirectional routes.
          const originIdx = nearestCoordIndex(routeCoords, originStopLng, originStopLat)
          const destIdx = nearestCoordIndex(routeCoords, destStopLng, destStopLat)

          let busDistanceKm = 0
          let subCoords: [number, number][] = []

          if (goesForward) {
            // Forward slice: originIdx → destIdx (in order)
            const lo = Math.min(originIdx, destIdx)
            const hi = Math.max(originIdx, destIdx)
            const sliced = routeCoords.slice(lo, hi + 1)
            // If the stop order is reversed relative to coord order, flip the slice
            const ordered = originIdx <= destIdx ? sliced : [...sliced].reverse()
            busDistanceKm = length(lineString(ordered.length >= 2 ? ordered : [ordered[0], ordered[0]]), { units: 'kilometers' })
            subCoords = ordered.map(c => [c[1], c[0]] as [number, number])
          } else {
            // Circular backward: originIdx → end of line, then start → destIdx
            const coords1 = routeCoords.slice(originIdx)
            const coords2 = routeCoords.slice(0, destIdx + 1)
            const allCoords = [...coords1, ...coords2]
            busDistanceKm = length(lineString(allCoords.length >= 2 ? allCoords : [allCoords[0], allCoords[0]]), { units: 'kilometers' })
            subCoords = allCoords.map(c => [c[1], c[0]] as [number, number])
          }

          // Calculate walking segments
          const walkOriginKm = distance(originPt, originStopPt, { units: 'kilometers' })
          const walkDestKm = distance(destStopPt, destPt, { units: 'kilometers' })

          // Calculate travel times (minutes)
          const busMinutes = (busDistanceKm / BUS_SPEED_KMH) * 60
          const walkMinutes = ((walkOriginKm + walkDestKm) / WALK_SPEED_KMH) * 60
          const totalMinutes = busMinutes + walkMinutes

          results.push({
            routeId: route.id,
            routeName: route.name,
            routeShortName: route.short_name,
            routeColor: route.category?.color_hex || '#3DBFA8',
            originStop,
            destStop,
            busDistanceKm,
            walkOriginKm,
            walkDestKm,
            totalMinutes,
            subPolylineCoords: subCoords
          })
        } catch (err) {
          // If slicing fails, log and continue
          console.warn('Failed to compute route slice:', err)
        }
      }
    }
  }

  // Sort by total travel time and return top 3
  return results.sort((a, b) => a.totalMinutes - b.totalMinutes).slice(0, 3)
}

/**
 * Returns all stops within `maxDistanceKm` of the given coordinate,
 * sorted nearest-first using Turf `distance`.
 *
 * @param lat           - Latitude of the query point.
 * @param lng           - Longitude of the query point.
 * @param stops         - Full `DBStop[]` array to filter (typically from `useStops`).
 * @param maxDistanceKm - Radius in kilometres. Defaults to `2.0`.
 * @returns Filtered and sorted `DBStop[]`.
 *
 * @example
 * const nearby = getNearbyStops(31.86, -116.60, allStops, 1.5)
 * // nearby[0] is the closest stop within 1.5 km
 */
export function getNearbyStops(
  lat: number,
  lng: number,
  stops: DBStop[],
  maxDistanceKm: number = 2.0
): DBStop[] {
  const pt = point([lng, lat])
  return stops
    .map(stop => {
      const stopPt = point(stop.geom.coordinates)
      const dist = distance(pt, stopPt, { units: 'kilometers' })
      return { stop, dist }
    })
    .filter(item => item.dist <= maxDistanceKm)
    .sort((a, b) => a.dist - b.dist)
    .map(item => item.stop)
}


