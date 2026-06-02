import { lineSlice, length, distance, point, lineString } from '@turf/turf'
import type { DBStop, RouteDetail, RoutingResult } from '../../types'

// Constants
const BUS_SPEED_KMH = 20
const WALK_SPEED_KMH = 5

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
          // Get the coordinates of the route LineString
          const routeCoords = route.geom.coordinates as [number, number][]
          const routeLine = lineString(routeCoords)

          let busDistanceKm = 0
          let subCoords: [number, number][] = []

          if (goesForward) {
            // Slice route line from origin stop to dest stop
            const sliced = lineSlice(originStopPt, destStopPt, routeLine)
            busDistanceKm = length(sliced, { units: 'kilometers' })
            // GeoJSON coordinates are [lng, lat], convert to [lat, lng] for Leaflet
            subCoords = sliced.geometry.coordinates.map(c => [c[1], c[0]] as [number, number])
          } else {
            // Circular route going backward (e.g. sequence 25 -> 3)
            // Slice from origin stop to end of route line, and start of route line to dest stop
            const endPt = point(routeCoords[routeCoords.length - 1])
            const startPt = point(routeCoords[0])
            
            const slice1 = lineSlice(originStopPt, endPt, routeLine)
            const slice2 = lineSlice(startPt, destStopPt, routeLine)
            
            busDistanceKm = length(slice1, { units: 'kilometers' }) + length(slice2, { units: 'kilometers' })
            
            const coords1 = slice1.geometry.coordinates.map(c => [c[1], c[0]] as [number, number])
            const coords2 = slice2.geometry.coordinates.map(c => [c[1], c[0]] as [number, number])
            subCoords = [...coords1, ...coords2]
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
          // If slicing fails due to turf limits, log and continue
          console.warn('Failed to compute route slice:', err)
        }
      }
    }
  }

  // Sort by total travel time and return top 3
  return results.sort((a, b) => a.totalMinutes - b.totalMinutes).slice(0, 3)
}

/**
 * Finds all stops within maxDistanceKm of a coordinate, sorted by proximity.
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

