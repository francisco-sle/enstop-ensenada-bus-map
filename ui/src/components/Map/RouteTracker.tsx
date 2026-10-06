import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type {} from 'leaflet-polylinedecorator'

// Set global L on window so the dependency leaflet-rotatedmarker can find it
if (typeof window !== 'undefined') {
  ;(window as typeof globalThis & { L?: typeof L }).L = L
}

import 'leaflet-polylinedecorator/src/L.PolylineDecorator.js'
import { darkenColor } from './colorUtils'

export interface RouteTrackerProps {
  coords: [number, number][]
  color: string
}

export function RouteTracker({ coords, color }: RouteTrackerProps) {
  const map = useMap()
  const decoratorRef = useRef<L.PolylineDecorator | null>(null)

  useEffect(() => {
    if (coords.length < 2) return

    const polyline = L.polyline(coords)
    // Open chevrons in a deeper shade of the route color stay legible on
    // both dark and light brand colors (e.g. yellow).
    const arrowColor = darkenColor(color, 45)

    const decorator = L.polylineDecorator(polyline, {
      patterns: [
        {
          offset: '40px',
          repeat: '80px',
          symbol: L.Symbol.arrowHead({
            pixelSize: 7,
            polygon: false,
            pathOptions: {
              color: arrowColor,
              opacity: 0.9,
              weight: 2.5,
              lineCap: 'round',
              lineJoin: 'round',
              stroke: true,
            },
          }),
        },
      ],
    })

    decorator.addTo(map)
    decoratorRef.current = decorator

    return () => {
      if (decoratorRef.current) {
        map.removeLayer(decoratorRef.current)
        decoratorRef.current = null
      }
    }
  }, [coords, color, map])

  return null
}
