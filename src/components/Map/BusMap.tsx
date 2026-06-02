import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, useMapEvents } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import { MapPin, Navigation } from 'lucide-react'
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

interface MapEventsHandlerProps {
  onRightClick: (latlng: L.LatLng | null) => void
}

function MapEventsHandler({ onRightClick }: MapEventsHandlerProps) {
  const { mapClickMode, setOrigin, setDestination, setMapClickMode } = useRoutingStore()

  useMapEvents({
    contextmenu(e) {
      if (e.originalEvent) {
        e.originalEvent.preventDefault()
      }
      
      if (mapClickMode) {
        const { lat, lng } = e.latlng
        const coordLabel = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        if (mapClickMode === 'origin') {
          setOrigin({ lat, lng, label: `Punto en Mapa (${coordLabel})` })
        } else {
          setDestination({ lat, lng, label: `Punto en Mapa (${coordLabel})` })
        }
        setMapClickMode(null)
        onRightClick(null)
      } else {
        onRightClick(e.latlng)
      }
    },
    click() {
      onRightClick(null)
    }
  })
  return null
}

interface BusMapProps {
  activeRoutes: RouteDetail[]
  allStops: DBStop[]
}

export function BusMap({ activeRoutes, allStops }: BusMapProps) {
  const { center, zoom, selectedStopId, selectedRouteId, userLocation, setSelectedStopId } = useMapStore()
  const { origin, destination, routingResults, selectedResultIndex, setOrigin, setDestination } = useRoutingStore()
  const [contextMenuPos, setContextMenuPos] = useState<{ lat: number; lng: number } | null>(null)

  // Custom Stop Icon generator based on route color or default
  const createStopIcon = (colorHex: string, isSelected: boolean) => {
    const size = isSelected ? 16 : 12
    return L.divIcon({
      className: 'custom-stop-marker',
      html: `<div style="
        background-color: ${colorHex}; 
        width: ${size}px; 
        height: ${size}px; 
        border-radius: 50%; 
        border: 2px solid white; 
        box-shadow: 0 0 6px rgba(0,0,0,0.6);
        transition: all 0.2s ease-in-out;
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
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
        <MapEventsHandler onRightClick={setContextMenuPos} />

        {contextMenuPos && (
          <Popup
            position={[contextMenuPos.lat, contextMenuPos.lng]}
            closeButton={false}
            autoPan={false}
            className="custom-context-menu-popup"
          >
            <div className="flex flex-col min-w-[130px] bg-surface rounded-lg overflow-hidden border border-white/8 shadow-card select-none">
              <button
                onClick={() => {
                  const coordLabel = `${contextMenuPos.lat.toFixed(4)}, ${contextMenuPos.lng.toFixed(4)}`
                  setOrigin({ lat: contextMenuPos.lat, lng: contextMenuPos.lng, label: `Origen (${coordLabel})` })
                  setContextMenuPos(null)
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-teal-400 hover:bg-white/5 border-b border-white/6 text-left"
              >
                <MapPin size={12} />
                <span>Origen</span>
              </button>
              <button
                onClick={() => {
                  const coordLabel = `${contextMenuPos.lat.toFixed(4)}, ${contextMenuPos.lng.toFixed(4)}`
                  setDestination({ lat: contextMenuPos.lat, lng: contextMenuPos.lng, label: `Destino (${coordLabel})` })
                  setContextMenuPos(null)
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-400 hover:bg-white/5 text-left"
              >
                <Navigation size={12} />
                <span>Destino</span>
              </button>
            </div>
          </Popup>
        )}
        
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
              color="var(--color-text-secondary)"
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
              color="var(--color-text-secondary)"
              weight={3}
              dashArray="6, 6"
              opacity={0.8}
            />
          </>
        )}

        {/* General Route Lines (Only when not viewing A-to-B results) */}
        {!activeResult && activeRoutes.map(route => {
          const isSelected = selectedRouteId === route.id
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
        {allStops.map(stop => {
          const isSelected = selectedStopId === stop.id
          const [lng, lat] = stop.geom.coordinates
          
          // Color coding of stop: matches selected route, active result, or default
          let color = '#8BA5BE' // default muted blue
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
    </div>
  )
}
