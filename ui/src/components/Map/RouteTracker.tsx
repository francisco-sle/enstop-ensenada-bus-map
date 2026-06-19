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
    const arrowColor = darkenColor(color, 35)

    const decorator = L.polylineDecorator(polyline, {
      patterns: [
        {
          offset: '50px',
          repeat: '100px',
          symbol: L.Symbol.arrowHead({
            pixelSize: 10,
            pathOptions: {
              color: arrowColor,
              fillColor: arrowColor,
              fillOpacity: 1,
              weight: 1.5,
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
