import { useEffect } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import { useRoutingStore } from '../../store/routingStore'
import type { ContextMenuPosition } from './MapContextMenu'

// ─── Map Controller Sub-component ───────────────────────────────────────────

export interface MapControllerProps {
  center: [number, number]
  zoom: number
}

export function MapController({ center, zoom }: MapControllerProps) {
  const map = useMap()
  useEffect(() => {
    // Short hops glide; longer jumps arc out and back in (flyTo).
    const distance = map.getCenter().distanceTo(center)
    if (distance > 1500 || Math.abs(map.getZoom() - zoom) > 2) {
      map.flyTo(center, zoom, { duration: 0.9, easeLinearity: 0.2 })
    } else {
      map.setView(center, zoom, { animate: true, duration: 0.5, easeLinearity: 0.2 })
    }
  }, [center, zoom, map])
  return null
}

// ─── Map Events Handler Sub-component ───────────────────────────────────────

export interface MapEventsHandlerProps {
  onRightClick: (data: ContextMenuPosition | null) => void
  onZoomEnd: (zoom: number) => void
}

export function MapEventsHandler({ onRightClick, onZoomEnd }: MapEventsHandlerProps) {
  const map = useMap()
  const { mapClickMode, setOrigin, setDestination, setMapClickMode } = useRoutingStore()

  useMapEvents({
    contextmenu(e) {
      if (e.originalEvent) e.originalEvent.preventDefault()
      const { lat, lng } = e.latlng
      const containerPoint = map.latLngToContainerPoint(e.latlng)

      if (mapClickMode) {
        const coordLabel = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        if (mapClickMode === 'origin') {
          setOrigin({ lat, lng, label: `Punto en Mapa (${coordLabel})` })
        } else {
          setDestination({ lat, lng, label: `Punto en Mapa (${coordLabel})` })
        }
        setMapClickMode(null)
        onRightClick(null)
      } else {
        onRightClick({ lat, lng, x: containerPoint.x, y: containerPoint.y })
      }
    },
    click() {
      onRightClick(null)
    },
    zoomstart() {
      onRightClick(null)
    },
    movestart() {
      onRightClick(null)
    },
    zoomend() {
      onZoomEnd(map.getZoom())
    },
  })
  return null
}
