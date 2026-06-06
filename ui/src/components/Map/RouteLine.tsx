import { useMemo } from 'react'
import { Polyline } from 'react-leaflet'
import { useSnappedPolyline } from '../../hooks/useSnappedPolyline'
import type { RouteDetail } from '../../types'

interface RouteLineProps {
  route: RouteDetail
  isSelected: boolean
}

export function RouteLine({ route, isSelected }: RouteLineProps) {
  const positions = useMemo(() => {
    return (route.geom.coordinates as [number, number][]).map(
      c => [c[1], c[0]] as [number, number]
    )
  }, [route.geom.coordinates])

  // Snap the general bus route to streets using the driving profile
  const { snappedCoords } = useSnappedPolyline(positions, 'driving')

  return (
    <Polyline
      positions={snappedCoords}
      color={route.category?.color_hex || '#3DBFA8'}
      weight={isSelected ? 6 : 3}
      opacity={isSelected ? 0.9 : 0.6}
    />
  )
}
