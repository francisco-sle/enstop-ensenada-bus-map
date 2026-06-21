import { Polyline } from 'react-leaflet'
import { RouteTracker } from './RouteTracker'
import type { RoutingResult } from '../../types'

interface ActiveRouteDisplayProps {
  origin: { lat: number; lng: number }
  destination: { lat: number; lng: number }
  activeResult: RoutingResult
}

export function ActiveRouteDisplay({ origin, destination, activeResult }: ActiveRouteDisplayProps) {
  const originStopCoords: [number, number] = [
    activeResult.originStop.geom.coordinates[1],
    activeResult.originStop.geom.coordinates[0],
  ]
  const destStopCoords: [number, number] = [
    activeResult.destStop.geom.coordinates[1],
    activeResult.destStop.geom.coordinates[0],
  ]

  // Walk origin leg (straight line fallback to save API costs)
  const walkOriginCoords: [number, number][] = [[origin.lat, origin.lng], originStopCoords]

  // Use pre-snapped route coordinates directly for the bus segment
  const busCoords = activeResult.subPolylineCoords

  // Walk destination leg (straight line fallback to save API costs)
  const walkDestCoords: [number, number][] = [destStopCoords, [destination.lat, destination.lng]]

  return (
    <>
      {/* Solid route path trace */}
      <Polyline positions={busCoords} color={activeResult.routeColor} weight={8} opacity={0.85} />

      {/* Moving arrows following the route direction */}
      <RouteTracker coords={busCoords} color={activeResult.routeColor} />

      {/* Walking leg from origin to boarding stop */}
      <Polyline
        positions={walkOriginCoords}
        color="#64748b"
        weight={3}
        dashArray="6, 6"
        opacity={0.8}
      />

      {/* Walking leg from alighting stop to destination */}
      <Polyline
        positions={walkDestCoords}
        color="#64748b"
        weight={3}
        dashArray="6, 6"
        opacity={0.8}
      />
    </>
  )
}
