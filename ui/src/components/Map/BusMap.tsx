import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import { useState, useMemo } from 'react'
import { useMapStore } from '../../store/mapStore'
import { useRoutingStore } from '../../store/routingStore'
import { useBusMapMarkers } from './useBusMapMarkers'
import { MapContextMenu } from './MapContextMenu'
import { RouteTracker } from './RouteTracker'
import { MapController, MapEventsHandler } from './mapControls'
import { createStopIcon, userLocationIcon, routingPinIcon } from './mapIcons'
import type { ContextMenuPosition } from './MapContextMenu'
import type { DBStop, RouteDetail } from '../../types'

// ─── Main Component ───────────────────────────────────────────────────────────

interface BusMapProps {
  activeRoutes: RouteDetail[]
  allStops: DBStop[]
  showFullRoutes?: boolean
}

export function BusMap({ activeRoutes, allStops, showFullRoutes = true }: BusMapProps) {
  const { center, zoom, selectedStopId, selectedRouteId, userLocation, setSelectedStopId } = useMapStore()
  const { origin, destination, routingResults, selectedResultIndex } = useRoutingStore()
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null)
  const [currentZoom, setCurrentZoom] = useState(zoom)
  const [prevZoom, setPrevZoom] = useState(zoom)

  // Sync local currentZoom with store's programmatic zoom during render
  if (zoom !== prevZoom) {
    setPrevZoom(zoom)
    setCurrentZoom(zoom)
  }

  const activeResult = selectedResultIndex !== null ? routingResults[selectedResultIndex] : null

  // Derive stop markers outside JSX — LoD filtering + color coding
  const stopMarkers = useBusMapMarkers({
    allStops,
    activeRoutes,
    selectedStopId,
    selectedRouteId,
    activeResult,
    currentZoom,
  })

  // Pre-build icons once per stopMarkers change — avoids calling renderToString inside JSX.
  // L.divIcon creation (+ renderToString) is expensive; memoizing collapses ~6 unique combos.
  const stopMarkerIcons = useMemo(
    () => stopMarkers.map(({ stop, color, isSelected }) => ({
      stop,
      icon: createStopIcon(color, isSelected),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stopMarkers, currentZoom]
  )

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

        {/* User GPS Location */}
        {userLocation && (
          <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={1000} />
        )}

        {/* Origin / Destination Pins */}
        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={routingPinIcon('A')} zIndexOffset={900} />
        )}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={routingPinIcon('B')} zIndexOffset={900} />
        )}

        {/* Active Routing Path */}
        {activeResult && origin && destination && (
          <>
            {/* Solid route path trace */}
            <Polyline
              positions={activeResult.subPolylineCoords}
              color={activeResult.routeColor}
              weight={8}
              opacity={0.85}
            />
            {/* Moving arrows following the route direction */}
            <RouteTracker
              coords={activeResult.subPolylineCoords}
              color={activeResult.routeColor}
            />
            <Polyline
              positions={[
                [origin.lat, origin.lng],
                [activeResult.originStop.geom.coordinates[1], activeResult.originStop.geom.coordinates[0]],
              ]}
              color="#64748b" weight={3} dashArray="6, 6" opacity={0.8}
            />
            <Polyline
              positions={[
                [activeResult.destStop.geom.coordinates[1], activeResult.destStop.geom.coordinates[0]],
                [destination.lat, destination.lng],
              ]}
              color="#64748b" weight={3} dashArray="6, 6" opacity={0.8}
            />
          </>
        )}

        {/* General Route Lines */}
        {!activeResult && activeRoutes.map(route => {
          const isSelected = selectedRouteId === route.id
          if (!showFullRoutes && !isSelected) return null
          const positions = (route.geom.coordinates as [number, number][]).map(
            c => [c[1], c[0]] as [number, number]
          )
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

        {/* Stop Markers — derived from useBusMapMarkers */}
        {stopMarkerIcons.map(({ stop, icon }) => {
          const [lng, lat] = stop.geom.coordinates
          return (
            <Marker
              key={stop.id}
              position={[lat, lng]}
              icon={icon}
              eventHandlers={{ click: () => setSelectedStopId(stop.id) }}
            />
          )
        })}
      </MapContainer>

      {/* Context Menu Overlay */}
      {contextMenu && (
        <MapContextMenu position={contextMenu} onClose={() => setContextMenu(null)} />
      )}
    </div>
  )
}
