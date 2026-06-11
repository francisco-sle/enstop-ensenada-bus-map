import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet'
import { useState, useRef, useEffect } from 'react'
import { createStopIcon } from './mapIcons'
import { useMapStore } from '../../store/mapStore'

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
  onDrawStart: () => void
  onDrawMove: (latlng: [number, number]) => void
  onDrawEnd: () => void
  onMapClick: (latlng: [number, number]) => void
}

function EditorEventsHandler({
  mode,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  onMapClick,
}: EditorEventsHandlerProps) {
  const map = useMap()
  const isDrawingRef = useRef(false)

  useEffect(() => {
    if (mode === 'draw-route') {
      map.doubleClickZoom.disable()
    } else {
      map.dragging.enable()
      map.doubleClickZoom.enable()
    }
  }, [mode, map])

  useMapEvents({
    mousedown(e) {
      if (mode !== 'draw-route') return
      isDrawingRef.current = true
      map.dragging.disable()
      onDrawStart()
      onDrawMove([e.latlng.lat, e.latlng.lng])
    },
    mousemove(e) {
      if (mode !== 'draw-route' || !isDrawingRef.current) return
      onDrawMove([e.latlng.lat, e.latlng.lng])
    },
    mouseup() {
      if (mode !== 'draw-route' || !isDrawingRef.current) return
      isDrawingRef.current = false
      map.dragging.enable()
      onDrawEnd()
    },
    click(e) {
      if (mode === 'add-stop') {
        onMapClick([e.latlng.lat, e.latlng.lng])
      }
    }
  })

  // Global mouseup handler in case user releases click outside the map
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawingRef.current) {
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
  routeCoords: [number, number][]
  stops: { id: string; name: string; lat: number; lng: number }[]
  onRouteCoordsSnapped: (coords: [number, number][]) => void
  onAddStop: (latlng: [number, number]) => void
  onDeleteStop: (id: string) => void
  snapTrace: (coords: [number, number][]) => Promise<[number, number][]>
  isSnapping: boolean
}

export function EditorMap({
  mode,
  routeCoords,
  stops,
  onRouteCoordsSnapped,
  onAddStop,
  onDeleteStop,
  snapTrace,
  isSnapping,
}: EditorMapProps) {
  const { center, zoom } = useMapStore()
  const [paintCoords, setPaintCoords] = useState<[number, number][]>([])
  const rawCoordsRef = useRef<[number, number][]>([])

  const handleDrawStart = () => {
    setPaintCoords([])
    rawCoordsRef.current = []
  }

  const handleDrawMove = (latlng: [number, number]) => {
    const raw = rawCoordsRef.current
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
    if (snapped && snapped.length > 0) {
      // Set the final snapped route coords
      onRouteCoordsSnapped(snapped)
    }
    setPaintCoords([])
  }

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        maxBounds={[[31.60, -116.90], [32.00, -116.35]]}
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
        />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Existing Snapped Route Line */}
        {routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords}
            color="var(--color-accent-cerulean)"
            weight={5}
            opacity={0.85}
          />
        )}

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
        {stops.map(stop => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={createStopIcon('#e0a32e', false)}
            eventHandlers={{
              click: () => {
                if (window.confirm(`¿Eliminar parada "${stop.name}"?`)) {
                  onDeleteStop(stop.id)
                }
              }
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
