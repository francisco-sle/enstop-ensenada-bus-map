import { MapContainer, Marker, Tooltip } from 'react-leaflet'
import { useState, useMemo } from 'react'
import type { LatLngBounds } from 'leaflet'
import { useMapStore } from '../../store/mapStore'
import { useRoutingStore } from '../../store/routingStore'
import { useBusMapMarkers } from './useBusMapMarkers'
import { MapContextMenu } from './MapContextMenu'
import { ActiveRouteDisplay } from './ActiveRouteDisplay'
import { RouteLine } from './RouteLine'
import { StopDotsLayer } from './StopDotsLayer'
import { MapController, MapEventsHandler, ViewportReporter } from './mapControls'
import type { MapInsets } from './mapControls'
import { createStopIcon, userLocationIcon, routingPinIconA, routingPinIconB } from './mapIcons'
import type { ContextMenuPosition } from './MapContextMenu'
import type { DBStop, RouteDetail } from '../../types'
import { Basemap } from './Basemap'
import { useRouteColors } from '../../hooks/useRouteColors'

// ─── Main Component ───────────────────────────────────────────────────────────

interface BusMapProps {
  activeRoutes: RouteDetail[]
  allStops: DBStop[]
  showFullRoutes?: boolean
  showRouting?: boolean
  focusedRouteId?: number | null
  ignoreVisibility?: boolean
  /** Floating UI covering the map; enables panel-aware centering and viewport reporting */
  insets?: MapInsets
}

export function BusMap({
  activeRoutes,
  allStops,
  showFullRoutes = true,
  showRouting = true,
  focusedRouteId,
  ignoreVisibility = false,
  insets,
}: BusMapProps) {
  const {
    center,
    zoom,
    selectedStopId,
    selectedRouteId: globalSelectedRouteId,
    userLocation,
    setSelectedStopId,
    shownRouteIds,
  } = useMapStore()

  const { origin, destination, routingResults, selectedResultIndex, setOrigin, setDestination } =
    useRoutingStore()
  const resolvedRouteId = focusedRouteId !== undefined ? focusedRouteId : globalSelectedRouteId

  // Routes drawn in color: the user's picks plus a route focused from a stop.
  // With nothing picked, every route counts as visible (the gray network) for stop markers.
  const colorRouteIds = useMemo(() => {
    if (ignoreVisibility) return activeRoutes.map((r) => r.id)
    if (resolvedRouteId !== null && !shownRouteIds.includes(resolvedRouteId)) {
      return [...shownRouteIds, resolvedRouteId]
    }
    return shownRouteIds
  }, [ignoreVisibility, activeRoutes, shownRouteIds, resolvedRouteId])

  const visibleRouteIds = useMemo(
    () => new Set(colorRouteIds.length > 0 ? colorRouteIds : activeRoutes.map((r) => r.id)),
    [colorRouteIds, activeRoutes],
  )

  const routeColors = useRouteColors(activeRoutes, colorRouteIds)
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null)
  const [currentZoom, setCurrentZoom] = useState(zoom)
  const [prevZoom, setPrevZoom] = useState(zoom)
  const [viewBounds, setViewBounds] = useState<LatLngBounds | null>(null)

  // Sync local currentZoom with store's programmatic zoom during render
  if (zoom !== prevZoom) {
    setPrevZoom(zoom)
    setCurrentZoom(zoom)
  }

  const activeResult =
    showRouting && selectedResultIndex !== null ? routingResults[selectedResultIndex] : null

  // Derive stop markers outside JSX — decluttering, viewport culling + color coding
  const { dots: stopDots, icons: stopIcons } = useBusMapMarkers({
    allStops,
    activeRoutes,
    selectedStopId,
    selectedRouteId: resolvedRouteId,
    selectedRouteColor: resolvedRouteId !== null ? routeColors.get(resolvedRouteId) : undefined,
    activeResult,
    currentZoom,
    bounds: viewBounds,
    visibleRouteIds,
  })

  // Pre-build icons once per marker change — avoids calling renderToString inside JSX.
  // L.divIcon creation (+ renderToString) is expensive; memoizing collapses ~6 unique combos.
  const stopMarkerIcons = useMemo(
    () =>
      stopIcons.map(({ stop, color, isSelected }) => ({
        stop,
        icon: createStopIcon(color, isSelected),
      })),
    [stopIcons],
  )

  return (
    <div className="w-full h-full relative">
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
        <MapController center={center} zoom={zoom} insets={insets} />
        <MapEventsHandler
          onRightClick={setContextMenu}
          onZoomEnd={setCurrentZoom}
          onBoundsChange={setViewBounds}
        />
        {insets && <ViewportReporter insets={insets} />}

        <Basemap />

        {/* User GPS Location */}
        {showRouting && userLocation && (
          <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={1000} />
        )}

        {/* Origin / Destination Pins */}
        {showRouting && origin && (
          <Marker
            position={[origin.lat, origin.lng]}
            icon={routingPinIconA}
            zIndexOffset={900}
            draggable={true}
            eventHandlers={{
              dragstart: (e) => {
                e.target.getElement()?.classList.add('is-dragging')
                e.target.closeTooltip()
              },
              dragend: (e) => {
                const el = e.target.getElement()
                setTimeout(() => el?.classList.remove('is-dragging'), 150)
                const position = e.target.getLatLng()
                setOrigin({
                  ...origin,
                  lat: position.lat,
                  lng: position.lng,
                  label: 'Ubicación seleccionada',
                })
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -44]} className="soft-tooltip">
              Arrastrar para mover
            </Tooltip>
          </Marker>
        )}
        {showRouting && destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={routingPinIconB}
            zIndexOffset={900}
            draggable={true}
            eventHandlers={{
              dragstart: (e) => {
                e.target.getElement()?.classList.add('is-dragging')
                e.target.closeTooltip()
              },
              dragend: (e) => {
                const el = e.target.getElement()
                setTimeout(() => el?.classList.remove('is-dragging'), 150)
                const position = e.target.getLatLng()
                setDestination({
                  ...destination,
                  lat: position.lat,
                  lng: position.lng,
                  label: 'Ubicación seleccionada',
                })
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -44]} className="soft-tooltip">
              Arrastrar para mover
            </Tooltip>
          </Marker>
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

        {/* Background network — every route not drawn in color, as a faint gray line */}
        {!activeResult &&
          showFullRoutes &&
          activeRoutes.map((route) =>
            route.geom && !routeColors.has(route.id) ? (
              <RouteLine key={`net-${route.id}`} route={route} variant="network" />
            ) : null,
          )}

        {/* Shown routes in color, in pick order so later picks draw on top */}
        {!activeResult &&
          colorRouteIds.map((routeId) => {
            const route = activeRoutes.find((r) => r.id === routeId)
            const isSelected = resolvedRouteId === routeId
            if (!route?.geom) return null
            if (!showFullRoutes && !isSelected) return null
            return (
              <RouteLine
                key={route.id}
                route={route}
                color={routeColors.get(route.id)}
                isSelected={isSelected}
                isGhosted={resolvedRouteId !== null && !isSelected}
              />
            )
          })}

        {/* Stop dots (mid zoom) and icons (street zoom) — derived from useBusMapMarkers */}
        <StopDotsLayer
          dots={stopDots}
          zoom={currentZoom}
          hasSelectedRoute={resolvedRouteId !== null && !activeResult}
          onSelect={setSelectedStopId}
        />
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
