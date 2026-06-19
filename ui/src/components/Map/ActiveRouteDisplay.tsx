import { Polyline } from 'react-leaflet'
import { useSnappedPolyline } from '../../hooks/useSnappedPolyline'
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

  // Snap walk origin leg to streets
  const { snappedCoords: walkOriginCoords } = useSnappedPolyline(
    [[origin.lat, origin.lng], originStopCoords],
    'foot',
  )

  // Use pre-snapped route coordinates directly for the bus segment
  const busCoords = activeResult.subPolylineCoords

  // Snap walk destination leg to streets
  const { snappedCoords: walkDestCoords } = useSnappedPolyline(
    [destStopCoords, [destination.lat, destination.lng]],
    'foot',
  )

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
