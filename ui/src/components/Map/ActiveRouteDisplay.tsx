import { useEffect, useRef } from 'react'
import { Polyline } from 'react-leaflet'
import type L from 'leaflet'
import { RouteTracker } from './RouteTracker'
import type { RoutingResult } from '../../types'

interface ActiveRouteDisplayProps {
  origin: { lat: number; lng: number }
  destination: { lat: number; lng: number }
  activeResult: RoutingResult
}

const WALK_STYLE = {
  color: '#7C8798',
  weight: 4,
  dashArray: '0.1 9',
  lineCap: 'round' as const,
  opacity: 0.9,
}

/** Traces an SVG path from start to end once, like a pen drawing the route. */
function useDrawIn(refs: React.RefObject<L.Polyline | null>[]) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const animations = refs.map((ref) => {
      const el = ref.current?.getElement() as SVGPathElement | undefined
      if (!el) return null
      const length = el.getTotalLength()
      return el.animate(
        [
          { strokeDasharray: `${length} ${length}`, strokeDashoffset: length },
          { strokeDasharray: `${length} ${length}`, strokeDashoffset: 0 },
        ],
        { duration: 1100, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      )
    })
    return () => animations.forEach((a) => a?.cancel())
    // Runs once per mount — the parent keys this component by result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function ActiveRouteDisplay({ origin, destination, activeResult }: ActiveRouteDisplayProps) {
  const casingRef = useRef<L.Polyline>(null)
  const lineRef = useRef<L.Polyline>(null)
  useDrawIn([casingRef, lineRef])

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
      {/* Walking legs — round dots */}
      <Polyline positions={walkOriginCoords} pathOptions={WALK_STYLE} interactive={false} />
      <Polyline positions={walkDestCoords} pathOptions={WALK_STYLE} interactive={false} />

      {/* Bus segment: casing (themed via `.route-casing`) + route color */}
      <Polyline
        ref={casingRef}
        positions={busCoords}
        pathOptions={{ color: '#ffffff', weight: 13, opacity: 1, className: 'route-casing' }}
        interactive={false}
      />
      <Polyline
        ref={lineRef}
        positions={busCoords}
        pathOptions={{ color: activeResult.routeColor, weight: 7, opacity: 1 }}
      />

      {/* Moving arrows following the route direction */}
      <RouteTracker coords={busCoords} color={activeResult.routeColor} />
    </>
  )
}
