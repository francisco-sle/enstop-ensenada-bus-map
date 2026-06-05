import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import { MapPin, Navigation, Bus } from 'lucide-react'
import { renderToString } from 'react-dom/server'
import { useMapStore } from '../../store/mapStore'
import { useRoutingStore } from '../../store/routingStore'
import type { DBStop, RouteDetail } from '../../types'

// Helper component to control map viewport
interface MapControllerProps {
  center: [number, number]
  zoom: number
}

function MapController({ center, zoom }: MapControllerProps) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.5 })
  }, [center, zoom, map])
  return null
}

interface ContextMenuData {
  lat: number
  lng: number
  x: number
  y: number
}

interface MapEventsHandlerProps {
  onRightClick: (data: ContextMenuData | null) => void
  onZoomEnd: (zoom: number) => void
}

function MapEventsHandler({ onRightClick, onZoomEnd }: MapEventsHandlerProps) {
  const map = useMap()
  const { mapClickMode, setOrigin, setDestination, setMapClickMode } = useRoutingStore()

  useMapEvents({
    contextmenu(e) {
      if (e.originalEvent) {
        e.originalEvent.preventDefault()
      }
      
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
        onRightClick({
          lat,
          lng,
          x: containerPoint.x,
          y: containerPoint.y
        })
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
    }
  })
  return null
}

// Helper to sanitize CSS color values to prevent XSS / injection
function sanitizeColor(color: string): string {
  if (/^#[0-9A-Fa-f]{3,8}$/.test(color)) return color
  if (/^var\(--[a-zA-Z0-9-]+\)$/.test(color)) return color
  return '#2563EB' // default typical blue map pin
}

interface BusMapProps {
  activeRoutes: RouteDetail[]
  allStops: DBStop[]
  showFullRoutes?: boolean
}

export function BusMap({ activeRoutes, allStops, showFullRoutes = true }: BusMapProps) {
  const { center, zoom, selectedStopId, selectedRouteId, userLocation, setSelectedStopId } = useMapStore()
  const { origin, destination, routingResults, selectedResultIndex, setOrigin, setDestination } = useRoutingStore()
  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null)
  const [currentZoom, setCurrentZoom] = useState(zoom)
  const [prevZoom, setPrevZoom] = useState(zoom)

  // Sync local currentZoom with store's programmatic zoom during render
  if (zoom !== prevZoom) {
    setPrevZoom(zoom)
    setCurrentZoom(zoom)
  }

  // Custom Stop Icon generator based on route color or default
  const createStopIcon = (colorHex: string, isSelected: boolean) => {
    const safeColor = sanitizeColor(colorHex)
    const size = isSelected ? 32 : 24
    
    const pinHtml = renderToString(
      <div style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
        transition: 'all 0.2s ease-in-out'
      }}>
        <MapPin 
          size={size} 
          color="#ffffff" 
          fill={safeColor} 
          strokeWidth={1.5} 
        />
        <div style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Bus size={isSelected ? 14 : 10} />
        </div>
      </div>
    )

    return L.divIcon({
      className: 'custom-stop-marker',
      html: pinHtml,
      iconSize: [size, size],
      iconAnchor: [size / 2, size * 22 / 24]
    })
  }

  // Geolocation pulsing marker
  const userLocationIcon = L.divIcon({
    className: 'user-location-marker',
    html: '<div class="user-location-pulse"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  })

  // Origin/Destination markers for routing
  const routingPinIcon = (label: 'A' | 'B') => {
    const bgColor = label === 'A' ? 'var(--color-accent-teal)' : 'var(--color-accent-warm)'
    return L.divIcon({
      className: 'routing-pin-marker',
      html: `<div style="
        background-color: ${bgColor}; 
        color: var(--color-text-inverse);
        font-weight: bold;
        font-size: 11px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      ">${label}</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })
  }

  // Determine current active routing suggestion
  const activeResult = selectedResultIndex !== null ? routingResults[selectedResultIndex] : null

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
        <MapController center={center} zoom={zoom} />
        <MapEventsHandler onRightClick={setContextMenu} onZoomEnd={setCurrentZoom} />
        
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* User GPS Location Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={1000} />
        )}

        {/* Origin / Destination Markers */}
        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={routingPinIcon('A')} zIndexOffset={900} />
        )}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={routingPinIcon('B')} zIndexOffset={900} />
        )}

        {/* Routing Bus Path segments (Active Suggestion) */}
        {activeResult && origin && destination && (
          <>
            {/* Bus segment */}
            <Polyline
              positions={activeResult.subPolylineCoords}
              color={activeResult.routeColor}
              weight={6}
              opacity={0.9}
            />
            {/* Walking segment A -> Stop */}
            <Polyline
              positions={[
                [origin!.lat, origin!.lng],
                [activeResult.originStop.geom.coordinates[1], activeResult.originStop.geom.coordinates[0]]
              ]}
              color="#64748b"
              weight={3}
              dashArray="6, 6"
              opacity={0.8}
            />
            {/* Walking segment Stop -> B */}
            <Polyline
              positions={[
                [activeResult.destStop.geom.coordinates[1], activeResult.destStop.geom.coordinates[0]],
                [destination!.lat, destination!.lng]
              ]}
              color="#64748b"
              weight={3}
              dashArray="6, 6"
              opacity={0.8}
            />
          </>
        )}

        {/* General Route Lines (Only when not viewing A-to-B results) */}
        {!activeResult && activeRoutes.map(route => {
          const isSelected = selectedRouteId === route.id
          if (!showFullRoutes && !isSelected) return null
          
          // GeoJSON LineString coordinates are [lng, lat], convert to [lat, lng] for Leaflet
          const positions = (route.geom.coordinates as [number, number][]).map(c => [c[1], c[0]] as [number, number])
          return (
            <Polyline
              key={route.id}
              positions={positions}
              color={route.category?.color_hex || '#3DBFA8'}
              weight={isSelected ? 6 : 3}
              opacity={isSelected ? 0.9 : 0.6}
            />
          )
        })}

        {/* Stops Markers */}
        {allStops
          .filter(stop => {
            // Always show the selected stop
            if (stop.id === selectedStopId) return true

            // Always show origin and destination stops for an active routing query
            if (activeResult) {
              if (stop.id === activeResult.originStop.id || stop.id === activeResult.destStop.id) {
                return true
              }
            }

            // Apply Level of Detail (LoD) based on zoom level
            if (currentZoom <= 12) {
              // Zoom 11-12: Show only terminals
              return stop.is_terminal
            } else if (currentZoom <= 14) {
              // Zoom 13-14: Show terminals + accessible (major) stops
              return stop.is_terminal || stop.accessible
            } else {
              // Zoom 15+: Show all stops
              return true
            }
          })
          .map(stop => {
            const isSelected = selectedStopId === stop.id
            const [lng, lat] = stop.geom.coordinates
            
            // Color coding of stop: matches selected route, active result, or default
            let color = '#2563EB' // default typical blue map pin
            if (isSelected) {
              color = 'var(--color-accent-warm)'
            } else if (activeResult) {
              if (stop.id === activeResult.originStop.id) {
                color = 'var(--color-accent-teal)'
              } else if (stop.id === activeResult.destStop.id) {
                color = 'var(--color-accent-warm)'
              }
            } else if (selectedRouteId) {
              const currentRoute = activeRoutes.find(r => r.id === selectedRouteId)
              const servesStop = currentRoute?.route_stops.some(rs => rs.stop_id === stop.id)
              if (servesStop) {
                color = currentRoute?.category?.color_hex || 'var(--color-accent-teal)'
              }
            }

            return (
              <Marker
                key={stop.id}
                position={[lat, lng]}
                icon={createStopIcon(color, isSelected)}
                eventHandlers={{
                  click: () => {
                    setSelectedStopId(stop.id)
                  }
                }}
              />
            )
          })}
      </MapContainer>

      {/* Custom Context Menu overlay */}
      {contextMenu && (
        <div
          style={{ left: contextMenu.x, top: contextMenu.y }}
          className="absolute z-[1001] flex flex-col min-w-[130px] bg-surface rounded-lg overflow-hidden border border-white/8 shadow-card select-none animate-fade-up"
        >
          <button
            onClick={() => {
              const coordLabel = `${contextMenu.lat.toFixed(4)}, ${contextMenu.lng.toFixed(4)}`
              setOrigin({ lat: contextMenu.lat, lng: contextMenu.lng, label: `Origen (${coordLabel})` })
              setContextMenu(null)
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-teal-400 hover:bg-white/5 border-b border-white/6 text-left w-full cursor-pointer transition-colors"
          >
            <MapPin size={12} />
            <span>Origen</span>
          </button>
          <button
            onClick={() => {
              const coordLabel = `${contextMenu.lat.toFixed(4)}, ${contextMenu.lng.toFixed(4)}`
              setDestination({ lat: contextMenu.lat, lng: contextMenu.lng, label: `Destino (${coordLabel})` })
              setContextMenu(null)
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-400 hover:bg-white/5 text-left w-full cursor-pointer transition-colors"
          >
            <Navigation size={12} />
            <span>Destino</span>
          </button>
        </div>
      )}
    </div>
  )
}
