import { useMemo } from 'react'
import { Polyline } from 'react-leaflet'
import type { RouteDetail } from '../../types'

interface RouteLineProps {
  route: RouteDetail
  /** Resolved line color (see routeColors.ts); ignored for the network variant */
  color?: string
  isSelected?: boolean
  /** True when *any* route is selected and this one is not */
  isGhosted?: boolean
  /** Thin, uncolored, non-interactive line for the background network */
  variant?: 'route' | 'network'
}

export function RouteLine({
  route,
  color,
  isSelected = false,
  isGhosted = false,
  variant = 'route',
}: RouteLineProps) {
  const positions = useMemo(() => {
    return (route.geom.coordinates as [number, number][]).map(
      (c) => [c[1], c[0]] as [number, number],
    )
  }, [route.geom.coordinates])

  // Network lines take their stroke from `.route-network` so they follow the theme
  if (variant === 'network') {
    return (
      <Polyline
        positions={positions}
        pathOptions={{ weight: 2.5, opacity: 1, className: 'route-line route-network' }}
        interactive={false}
      />
    )
  }

  // Visual weight/opacity per focus state — `route-line` transitions between them
  const weight = isSelected ? 6 : isGhosted ? 3 : 4
  const opacity = isSelected ? 1 : isGhosted ? 0.22 : 0.9
  const casingWeight = isSelected ? 12 : 8
  const casingOpacity = isGhosted ? 0 : isSelected ? 1 : 0.85

  return (
    <>
      {/* Casing lifts the line off the basemap; `.route-casing` themes its color */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#ffffff',
          weight: casingWeight,
          opacity: casingOpacity,
          className: 'route-line route-casing',
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
