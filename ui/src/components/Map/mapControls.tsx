import { useCallback, useEffect, useRef } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import { useRoutingStore } from '../../store/routingStore'
import { useMapStore } from '../../store/mapStore'
import type { ContextMenuPosition } from './MapContextMenu'

// ─── Map Controller Sub-component ───────────────────────────────────────────

/** Pixels of the map covered by floating UI, measured from each container edge. */
export interface MapInsets {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

export interface MapControllerProps {
  center: [number, number]
  zoom: number
  insets?: MapInsets
}

export function MapController({ center, zoom, insets }: MapControllerProps) {
  const map = useMap()
  const isFirstRun = useRef(true)
  const left = insets?.left ?? 0
  const right = insets?.right ?? 0

  useEffect(() => {
    // Center the target in the uncovered part of the map, not behind a panel.
    // Ensenada's sea lies west, so a left panel mostly covers water this way.
    const offsetX = (left - right) / 2
    const target = offsetX
      ? map.unproject(map.project(center, zoom).subtract([offsetX, 0]), zoom)
      : center

    if (isFirstRun.current) {
      isFirstRun.current = false
      map.setView(target, zoom, { animate: false })
      return
    }

    // Short hops glide; longer jumps arc out and back in (flyTo).
    const distance = map.getCenter().distanceTo(target)
    if (distance > 1500 || Math.abs(map.getZoom() - zoom) > 2) {
      map.flyTo(target, zoom, { duration: 0.9, easeLinearity: 0.2 })
    } else {
      map.setView(target, zoom, { animate: true, duration: 0.5, easeLinearity: 0.2 })
    }
  }, [center, zoom, map, left, right])
  return null
}

// ─── Viewport Reporter Sub-component ────────────────────────────────────────

/**
 * Publishes the bounds of the uncovered map area to the store so lists like
 * "En esta zona" only count routes the user can actually see.
 */
export function ViewportReporter({ insets }: { insets: MapInsets }) {
  const map = useMap()
  const setViewBounds = useMapStore((s) => s.setViewBounds)
  const { top = 0, right = 0, bottom = 0, left = 0 } = insets

  const report = useCallback(() => {
    const size = map.getSize()
    const sw = map.containerPointToLatLng([left, Math.max(top, size.y - bottom)])
    const ne = map.containerPointToLatLng([Math.max(left, size.x - right), top])
    setViewBounds([
      [sw.lat, sw.lng],
      [ne.lat, ne.lng],
    ])
  }, [map, setViewBounds, top, right, bottom, left])

  useEffect(() => {
    map.whenReady(report)
  }, [map, report])

  useMapEvents({ moveend: report, resize: report })
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
