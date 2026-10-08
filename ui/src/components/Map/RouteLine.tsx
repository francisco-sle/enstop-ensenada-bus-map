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

  // Visual weight/opacity per focus state — `route-line` transitions between them
  const weight = isSelected ? 6 : isGhosted ? 3 : 4
  const opacity = isSelected ? 1 : isGhosted ? 0.22 : 0.8
  const casingWeight = isSelected ? 12 : 8
  const casingOpacity = isGhosted ? 0 : isSelected ? 1 : 0.85

  return (
    <>
      {/* White casing lifts the line off the light basemap */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#ffffff',
          weight: casingWeight,
          opacity: casingOpacity,
          className: 'route-line',
        }}
        interactive={false}
      />
      <Polyline
        positions={positions}
        pathOptions={{ color, weight, opacity, className: 'route-line' }}
      />
    </>
  )
}
