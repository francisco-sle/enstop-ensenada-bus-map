import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { useState, useMemo } from 'react'
import { useMapStore } from '../../store/mapStore'
import { useRoutingStore } from '../../store/routingStore'
import { useBusMapMarkers } from './useBusMapMarkers'
import { MapContextMenu } from './MapContextMenu'
import { ActiveRouteDisplay } from './ActiveRouteDisplay'
import { RouteLine } from './RouteLine'
import { RouteToggleLegend } from './RouteToggleLegend'
import { MapController, MapEventsHandler } from './mapControls'
import { createStopIcon, userLocationIcon, routingPinIcon } from './mapIcons'
import type { ContextMenuPosition } from './MapContextMenu'
import type { DBStop, RouteDetail } from '../../types'

// ─── Main Component ───────────────────────────────────────────────────────────

interface BusMapProps {
  activeRoutes: RouteDetail[]
  allStops: DBStop[]
  showFullRoutes?: boolean
  showRouting?: boolean
  focusedRouteId?: number | null
}

export function BusMap({ activeRoutes, allStops, showFullRoutes = true, showRouting = true, focusedRouteId }: BusMapProps) {
  const { center, zoom, selectedStopId, selectedRouteId: globalSelectedRouteId, userLocation, setSelectedStopId, hiddenRouteIds } = useMapStore()
  const { origin, destination, routingResults, selectedResultIndex } = useRoutingStore()
  const resolvedRouteId = focusedRouteId !== undefined ? focusedRouteId : globalSelectedRouteId
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null)
  const [currentZoom, setCurrentZoom] = useState(zoom)
  const [prevZoom, setPrevZoom] = useState(zoom)

  // Sync local currentZoom with store's programmatic zoom during render
  if (zoom !== prevZoom) {
    setPrevZoom(zoom)
    setCurrentZoom(zoom)
  }

  const activeResult = (showRouting && selectedResultIndex !== null) ? routingResults[selectedResultIndex] : null

  // Derive stop markers outside JSX — LoD filtering + color coding
  const stopMarkers = useBusMapMarkers({
    allStops,
    activeRoutes,
    selectedStopId,
    selectedRouteId: resolvedRouteId,
    activeResult,
    currentZoom,
    hiddenRouteIds,
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
        {showRouting && userLocation && (
          <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={1000} />
        )}

        {/* Origin / Destination Pins */}
        {showRouting && origin && (
          <Marker position={[origin.lat, origin.lng]} icon={routingPinIcon('A')} zIndexOffset={900} />
        )}
        {showRouting && destination && (
          <Marker position={[destination.lat, destination.lng]} icon={routingPinIcon('B')} zIndexOffset={900} />
        )}

        {/* Active Routing Path */}
        {activeResult && origin && destination && (
          <ActiveRouteDisplay
            key={`${activeResult.routeId}-${activeResult.originStop.id}-${activeResult.destStop.id}`}
            origin={origin}
            destination={destination}
            activeResult={activeResult}
          />
        )}

        {/* General Route Lines */}
        {!activeResult && activeRoutes.map(route => {
          const isSelected = resolvedRouteId === route.id
          const isHidden = hiddenRouteIds.has(route.id)
          if (!showFullRoutes && !isSelected) return null
          if (isHidden) return null
          return (
            <RouteLine
              key={route.id}
              route={route}
              isSelected={isSelected}
              isGhosted={resolvedRouteId !== null && !isSelected}
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

      {/* Route Toggle Legend — outside MapContainer to avoid capturing Leaflet events */}
      {showFullRoutes && <RouteToggleLegend routes={activeRoutes} />}
    </div>
  )
}
