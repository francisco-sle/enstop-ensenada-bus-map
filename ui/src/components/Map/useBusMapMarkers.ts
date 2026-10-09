import { useMemo } from 'react'
import type { LatLngBounds } from 'leaflet'
import type { DBStop, RouteDetail } from '../../types'
import type { RoutingResult } from '../../types'
import {
  ICON_ZOOM,
  layoutStops,
  routeStopSpacingPx,
  stopGateZoom,
  stopPriority,
  stopSpacingPx,
  type LayoutPoint,
} from './stopLayout'

interface BusMapMarkersOptions {
  allStops: DBStop[]
  activeRoutes: RouteDetail[]
  selectedStopId: number | null
  selectedRouteId: number | null
  /** Line color of the highlighted route, so its stops match it */
  selectedRouteColor?: string
  activeResult: RoutingResult | null
  currentZoom: number
  /** Visible map area; stops well outside it aren't rendered. Null renders everywhere. */
  bounds: LatLngBounds | null
  visibleRouteIds: Set<number>
}

export interface StopMarkerData {
  stop: DBStop
  color: string
  isSelected: boolean
  /** Served by the highlighted route */
  onSelectedRoute: boolean
}

interface StopMarkerLayers {
  /** Drawn as small canvas dots (below ICON_ZOOM) */
  dots: StopMarkerData[]
  /** Drawn as full DOM icon markers (selected stop, routing endpoints, street zoom) */
  icons: StopMarkerData[]
}

/**
 * Derives the stops to render, applying:
 *   1. Hidden-route suppression — stops exclusively on hidden routes are removed.
 *   2. Collision-based decluttering (see stopLayout.ts): each stop gets the lowest
 *      zoom at which it fits without crowding a more important stop. Stops of the
 *      highlighted route are placed first, packed tighter, and are always shown.
 *   3. Viewport culling — only stops inside `bounds` become map layers.
 *   4. Pin color coding based on selection, routing context, or active route.
 *
 * The selected stop and routing endpoints bypass decluttering and always render as icons.
 */
export function useBusMapMarkers({
  allStops,
  activeRoutes,
  selectedStopId,
  selectedRouteId,
  selectedRouteColor,
  activeResult,
  currentZoom,
  bounds,
  visibleRouteIds,
}: BusMapMarkersOptions): StopMarkerLayers {
  // stop id → ids of the routes serving it. Built once per data load instead of
  // scanning every route's stop list for every stop on every render.
  const routesByStop = useMemo(() => {
    const index = new Map<number, number[]>()
    for (const route of activeRoutes) {
      for (const rs of route.route_stops ?? []) {
        const ids = index.get(rs.stop_id)
        if (ids) ids.push(route.id)
        else index.set(rs.stop_id, [route.id])
      }
    }
    return index
  }, [activeRoutes])

  // Candidates: stops served by at least one visible route (orphans and stops
  // only on hidden routes are dropped), split by the highlighted route.
  const layout = useMemo(() => {
    const routePoints: LayoutPoint[] = []
    const otherPoints: LayoutPoint[] = []
    for (const stop of allStops) {
      const serving = routesByStop.get(stop.id)
      if (!serving) continue
      const visibleCount = serving.filter((id) => visibleRouteIds.has(id)).length
      if (visibleCount === 0) continue

      const [lng, lat] = stop.geom.coordinates
      const isTerminal = !!stop.is_terminal
      const point: LayoutPoint = {
        id: stop.id,
        lng,
        lat,
        priority: stopPriority(isTerminal, visibleCount, !!stop.accessible),
        gateZoom: stopGateZoom(isTerminal, visibleCount),
      }
      if (selectedRouteId !== null && serving.includes(selectedRouteId)) {
        routePoints.push({ ...point, gateZoom: 0 })
      } else {
        otherPoints.push(point)
      }
    }

    const routeLayout = layoutStops(routePoints, { spacing: routeStopSpacingPx })
    const obstacles = routePoints.map((p) => ({ ...p, minZoom: routeLayout.get(p.id)! }))
    const otherLayout = layoutStops(otherPoints, { spacing: stopSpacingPx, obstacles })
    return new Map([...otherLayout, ...routeLayout])
  }, [allStops, routesByStop, visibleRouteIds, selectedRouteId])

  return useMemo(() => {
    const zoom = Math.round(currentZoom)
    const endpointIds = activeResult
      ? new Set([activeResult.originStop.id, activeResult.destStop.id])
      : null
    const routeColor =
      selectedRouteColor ||
      activeRoutes.find((r) => r.id === selectedRouteId)?.category?.color_hex ||
      'var(--color-accent-cerulean)'
    // Margins absorb short pans until the next moveend. Dots match the canvas
    // renderer's padding; DOM icons are costlier, so they get a tighter margin.
    const dotBounds = bounds?.pad(0.5)
    const iconBounds = bounds?.pad(0.2)
    const dots: StopMarkerData[] = []
    const icons: StopMarkerData[] = []

    for (const stop of allStops) {
      const isSelected = stop.id === selectedStopId
      const isEndpoint = endpointIds?.has(stop.id) ?? false
      const minZoom = layout.get(stop.id)
      if (!isSelected && !isEndpoint && (minZoom === undefined || minZoom > zoom)) continue

      const asIcon = isSelected || isEndpoint || zoom >= ICON_ZOOM
      const [lng, lat] = stop.geom.coordinates
      const cull = asIcon ? iconBounds : dotBounds
      if (cull && !isSelected && !cull.contains([lat, lng])) continue

      const onSelectedRoute =
        selectedRouteId !== null && (routesByStop.get(stop.id)?.includes(selectedRouteId) ?? false)

      let color = '#2563EB' // default blue
      if (isSelected) {
        color = 'var(--color-accent-warm)'
      } else if (activeResult) {
        if (stop.id === activeResult.originStop.id) color = 'var(--color-accent-cerulean)'
        else if (stop.id === activeResult.destStop.id) color = 'var(--color-accent-warm)'
      } else if (onSelectedRoute) {
        color = routeColor
      }

      const marker = { stop, color, isSelected, onSelectedRoute }
      if (asIcon) icons.push(marker)
      else dots.push(marker)
    }

    return { dots, icons }
  }, [
    allStops,
    layout,
    routesByStop,
    currentZoom,
    bounds,
    selectedStopId,
    selectedRouteId,
    selectedRouteColor,
    activeRoutes,
    activeResult,
  ])
}
