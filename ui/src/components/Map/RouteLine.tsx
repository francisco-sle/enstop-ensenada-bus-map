import { useMemo } from 'react'
import { Polyline } from 'react-leaflet'
import type { RouteDetail } from '../../types'

interface RouteLineProps {
  route: RouteDetail
  isSelected: boolean
  /** True when *any* route is selected and this one is not */
  isGhosted: boolean
}

export function RouteLine({ route, isSelected, isGhosted }: RouteLineProps) {
  const positions = useMemo(() => {
    return (route.geom.coordinates as [number, number][]).map(
      (c) => [c[1], c[0]] as [number, number],
    )
  }, [route.geom.coordinates])

  const color = route.brand?.color_hex || route.category?.color_hex || '#3DBFA8'

  // Visual weight/opacity per focus state
  const weight = isSelected ? 6 : isGhosted ? 2 : 3
  const opacity = isSelected ? 1.0 : isGhosted ? 0.2 : 0.55

  return (
    <>
      {/* Halo — white wider polyline underneath for glow effect on selected route */}
      {isSelected && (
        <Polyline
          positions={positions}
          color="#ffffff"
          weight={10}
          opacity={0.45}
          interactive={false}
        />
      )}
      <Polyline positions={positions} color={color} weight={weight} opacity={opacity} />
    </>
  )
}
