import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useState, useRef, useEffect } from 'react'
import { createStopIcon } from './mapIcons'
import { useMapStore } from '../../store/mapStore'
import type { DrawStroke } from '../../pages/EditorPage'
import type { SnappedRoute } from '../../hooks/useOsrmRoute'
import { mapStyles } from './mapConfig'

const nodeIcon = L.divIcon({
  className: 'bg-white border-2 border-pacific rounded-full cursor-pointer shadow-sm !w-3 !h-3',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

const activeNodeIcon = L.divIcon({
  className:
    'bg-amber-400 border-2 border-white rounded-full cursor-pointer shadow-[0_0_0_4px_rgba(251,191,36,0.4)] !w-3.5 !h-3.5 animate-pulse',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

// A simpler MapController to center/zoom without store dependency issues
function EditorMapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

interface EditorEventsHandlerProps {
  mode: 'draw-route' | 'add-stop' | 'view'
  onDrawStart: (latlng: [number, number]) => boolean | void
  onDrawMove: (latlng: [number, number]) => void
  onDrawEnd: () => void
  onMapClick: (latlng: [number, number]) => void
  onMapBackgroundClick?: () => void
}

function EditorEventsHandler({
  mode,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  onMapClick,
  onMapBackgroundClick,
}: EditorEventsHandlerProps) {
  const map = useMap()
  const isDrawingRef = useRef(false)

  useEffect(() => {
    if (mode === 'draw-route') {
      map.doubleClickZoom.disable()
    } else {
      map.doubleClickZoom.enable()
    }
  }, [mode, map])

  useMapEvents({
    mousedown(e) {
      if (mode !== 'draw-route') return
      if (e.originalEvent.button === 2) {
        if (onDrawStart([e.latlng.lat, e.latlng.lng]) === false) return
        isDrawingRef.current = true
        map.dragging.disable()
        onDrawMove([e.latlng.lat, e.latlng.lng])
      }
    },
    mousemove(e) {
      if (mode !== 'draw-route' || !isDrawingRef.current) return
      onDrawMove([e.latlng.lat, e.latlng.lng])
    },
    mouseup(e) {
      if (mode !== 'draw-route' || !isDrawingRef.current) return
      if (e.originalEvent.button === 2) {
        isDrawingRef.current = false
        map.dragging.enable()
        onDrawEnd()
      }
    },
    click(e) {
      if (mode === 'add-stop') {
        onMapClick([e.latlng.lat, e.latlng.lng])
      } else {
        onMapBackgroundClick?.()
      }
    },
  })

  useEffect(() => {
    const disableContextMenu = (e: MouseEvent) => {
      if (mode === 'draw-route') e.preventDefault()
    }
    window.addEventListener('contextmenu', disableContextMenu)
    return () => window.removeEventListener('contextmenu', disableContextMenu)
  }, [mode])

  // Global mouseup handler in case user releases click outside the map
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDrawingRef.current && e.button === 2) {
        isDrawingRef.current = false
        map.dragging.enable()
        onDrawEnd()
      }
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [map, onDrawEnd])

  return null
}

interface EditorMapProps {
  mode: 'draw-route' | 'add-stop' | 'view'
  strokes: DrawStroke[]
  stops: { id: string; name: string; lat: number; lng: number }[]
  onRouteCoordsSnapped: (coords: SnappedRoute) => void
  onAddStop: (latlng: [number, number]) => void
  onDeleteStop: (id: string) => void
  snapTrace: (coords: [number, number][]) => Promise<SnappedRoute | null>
  isSnapping: boolean
  onNodeDragStart: () => void
  onLineClick: (strokeId: string, traceInsertIdx: number, coord: [number, number]) => void
  onNodeDrag: (strokeId: string, nodeIndex: number, newCoord: [number, number]) => void
  onNodeDragEnd: () => void
  selectedNode?: { strokeId: string; nodeIndex: number } | null
  onSelectNode?: (node: { strokeId: string; nodeIndex: number } | null) => void
}

export function EditorMap({
  mode,
  strokes,
  stops,
  onRouteCoordsSnapped,
  onAddStop,
  onDeleteStop,
  snapTrace,
  isSnapping,
  onNodeDragStart,
  onLineClick,
  onNodeDrag,
  onNodeDragEnd,
  selectedNode,
  onSelectNode,
}: EditorMapProps) {
  const { center, zoom } = useMapStore()
  const [paintCoords, setPaintCoords] = useState<[number, number][]>([])
  const rawCoordsRef = useRef<[number, number][]>([])

  const handleDrawStart = (latlng: [number, number]) => {
    setPaintCoords([])

    if (strokes.length > 0) {
      const lastStroke = strokes[strokes.length - 1]
      if (lastStroke.trace.length > 0) {
        const lastPoint = lastStroke.trace[lastStroke.trace.length - 1]
        const latDiff = Math.abs(latlng[0] - lastPoint[0])
        const lngDiff = Math.abs(latlng[1] - lastPoint[1])
        if (latDiff > 0.0005 || lngDiff > 0.0005) {
          alert('La nueva ruta debe continuar desde el final del trazo anterior.')
          rawCoordsRef.current = [] // Invalid start
          return false
        }
        rawCoordsRef.current = [lastPoint]
        return true
      }
    }

    rawCoordsRef.current = []
    return true
  }

  const handleDrawMove = (latlng: [number, number]) => {
    const raw = rawCoordsRef.current
    if (!raw) return // e.g. if started too far

    if (raw.length === 0) {
      raw.push(latlng)
      setPaintCoords([latlng])
    } else {
      const last = raw[raw.length - 1]
      // Collect points ~5m apart — fine enough to capture curves/turns faithfully.
      // RDP simplification in useOsrmRoute will thin redundant collinear points before the API call.
      const dist = Math.sqrt(Math.pow(latlng[0] - last[0], 2) + Math.pow(latlng[1] - last[1], 2))
      if (dist > 0.00005) {
        raw.push(latlng)
        setPaintCoords([...raw])
      }
    }
  }

  const handleDrawEnd = async () => {
    const raw = rawCoordsRef.current
    if (raw.length < 2) {
      setPaintCoords([])
      return
    }

    // Call snapped route api
    const snapped = await snapTrace(raw)
    if (snapped && snapped.trace.length > 0) {
      // Set the final snapped route coords
      onRouteCoordsSnapped(snapped)
    }
    setPaintCoords([])
  }

  const handleLineClick = (strokeId: string, e: L.LeafletMouseEvent) => {
    if (mode !== 'draw-route') return
    const stroke = strokes.find((s) => s.id === strokeId)
    if (!stroke) return

    let minDist = Infinity
    let bestIdx = -1
    let bestPoint: [number, number] = [0, 0]

    for (let i = 0; i < stroke.trace.length - 1; i++) {
      const A = stroke.trace[i]
      const B = stroke.trace[i + 1]

      const dx = B[0] - A[0]
      const dy = B[1] - A[1]

      if (dx === 0 && dy === 0) continue

      const t = ((e.latlng.lat - A[0]) * dx + (e.latlng.lng - A[1]) * dy) / (dx * dx + dy * dy)
      const tClamped = Math.max(0, Math.min(1, t))

      const projLat = A[0] + tClamped * dx
      const projLng = A[1] + tClamped * dy

      const dist = Math.pow(e.latlng.lat - projLat, 2) + Math.pow(e.latlng.lng - projLng, 2)

      if (dist < minDist) {
        minDist = dist
        bestIdx = i
        bestPoint = [projLat, projLng]
      }
    }

    if (bestIdx === -1) return

    onLineClick(strokeId, bestIdx + 1, bestPoint)
  }

  return (
    <div
      className={`w-full h-full relative ${mode === 'draw-route' ? '[&_.leaflet-container]:cursor-crosshair' : ''}`}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        maxBounds={[
          [31.6, -116.9],
          [32.0, -116.35],
        ]}
        maxBoundsViscosity={0.9}
        minZoom={11}
        style={{ width: '100%', height: '100%' }}
      >
        <EditorMapController center={center} zoom={zoom} />

        <EditorEventsHandler
          mode={mode}
          onDrawStart={handleDrawStart}
          onDrawMove={handleDrawMove}
          onDrawEnd={handleDrawEnd}
          onMapClick={onAddStop}
          onMapBackgroundClick={() => onSelectNode?.(null)}
        />

        <TileLayer
          url={mapStyles.lightMode.url}
          attribution={mapStyles.lightMode.attribution}
          maxZoom={mapStyles.lightMode.maxZoom}
        />

        {/* Existing Snapped Route Lines */}
        {strokes.map((stroke) => (
          <Polyline
            key={`poly-${stroke.id}`}
            positions={stroke.trace}
            color="var(--color-accent-cerulean)"
            weight={5}
            opacity={0.85}
            eventHandlers={{
              dblclick: (e) => handleLineClick(stroke.id, e),
            }}
          />
        ))}

        {/* Draggable Nodes for the Snapped Traces */}
        {/* Render Editable Nodes */}
        {strokes.map((stroke, strokeIndex) => {
          const isLastStroke = strokeIndex === strokes.length - 1
          return stroke.nodes.map((node, nodeIndex) => {
            const isTerminalNode = isLastStroke && nodeIndex === stroke.nodes.length - 1
            const isSelected =
              selectedNode?.strokeId === stroke.id && selectedNode?.nodeIndex === nodeIndex

            return (
              <Marker
                key={`node-${stroke.id}-${nodeIndex}`}
                position={node.coord}
                icon={isSelected ? activeNodeIcon : isTerminalNode ? activeNodeIcon : nodeIcon}
                draggable={mode === 'draw-route'}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e.originalEvent)
                    onSelectNode?.({ strokeId: stroke.id, nodeIndex })
                  },
                  dragstart: onNodeDragStart,
                  drag: (e) =>
                    onNodeDrag(stroke.id, nodeIndex, [
                      e.target.getLatLng().lat,
                      e.target.getLatLng().lng,
                    ]),
                  dragend: onNodeDragEnd,
                }}
              />
            )
          })
        })}

        {/* Active painting trace */}
        {paintCoords.length > 0 && (
          <Polyline
            positions={paintCoords}
            color="var(--color-accent-warm)"
            weight={4}
            opacity={0.6}
            dashArray="5, 10"
          />
        )}

        {/* Placed Stops Markers */}
        {stops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={createStopIcon('#e0a32e', false)}
            eventHandlers={{
              click: () => {
                if (window.confirm(`¿Eliminar parada "${stop.name}"?`)) {
                  onDeleteStop(stop.id)
                }
              },
            }}
          />
        ))}
      </MapContainer>

      {/* Loading Snapping Overlay */}
      {isSnapping && (
        <div className="absolute inset-0 bg-earth/40 backdrop-blur-[2px] flex items-center justify-center z-1001 pointer-events-none select-none">
          <div className="bg-surface border border-white/8 rounded-xl p-4 flex items-center gap-3 shadow-card animate-pulse">
            <div className="w-5 h-5 rounded-full border-2 border-pacific border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-white">Ajustando ruta a las calles...</span>
          </div>
        </div>
      )}
    </div>
  )
}
