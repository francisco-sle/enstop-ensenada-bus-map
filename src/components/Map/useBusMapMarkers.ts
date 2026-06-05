import type { DBStop, RouteDetail } from '../../types'
import type { RoutingResult } from '../../types'

interface BusMapMarkersOptions {
  allStops: DBStop[]
  activeRoutes: RouteDetail[]
  selectedStopId: number | null
  selectedRouteId: number | null
  activeResult: RoutingResult | null
  currentZoom: number
}

interface StopMarkerData {
  stop: DBStop
  color: string
  isSelected: boolean
}

/**
 * Derives the list of stops to render as map markers, applying:
 *   1. Level-of-Detail (LoD) filtering based on the current zoom level.
 *   2. Pin color coding based on selection, routing context, or active route.
 *
 * Keeping this logic out of the render tree avoids deeply nested conditions
 * inside JSX and makes the filtering rules independently testable.
 *
 * @param options.allStops       - Full stops array from the store.
 * @param options.activeRoutes   - Routes currently drawn on the map.
 * @param options.selectedStopId - ID of the currently selected stop (always shown).
 * @param options.selectedRouteId - ID of the currently highlighted route.
 * @param options.activeResult   - Active routing suggestion (origin/dest stops always shown).
 * @param options.currentZoom    - Current Leaflet zoom level.
 * @returns Array of `{ stop, color, isSelected }` ready to pass to `createStopIcon`.
 *
 * @example
 * const markers = useBusMapMarkers({ allStops, activeRoutes, selectedStopId, selectedRouteId, activeResult, currentZoom })
 * // markers.map(({ stop, color, isSelected }) => <StopMarker ... />)
 */
export function useBusMapMarkers({
  allStops,
  activeRoutes,
  selectedStopId,
  selectedRouteId,
  activeResult,
  currentZoom,
}: BusMapMarkersOptions): StopMarkerData[] {
  const currentRoute = selectedRouteId
    ? activeRoutes.find(r => r.id === selectedRouteId) ?? null
    : null

  return allStops
    .filter(stop => {
      // Priority 1: always show the selected stop
      if (stop.id === selectedStopId) return true

      // Priority 2: always show active routing endpoints
      if (
        activeResult &&
        (stop.id === activeResult.originStop.id || stop.id === activeResult.destStop.id)
      ) {
        return true
      }

      // Level-of-Detail filtering by zoom
      if (currentZoom <= 12) return stop.is_terminal
      if (currentZoom <= 14) return stop.is_terminal || stop.accessible
      return true
    })
    .map(stop => {
      const isSelected = stop.id === selectedStopId
      let color = '#2563EB' // default blue

      if (isSelected) {
        color = 'var(--color-accent-warm)'
      } else if (activeResult) {
        if (stop.id === activeResult.originStop.id) color = 'var(--color-accent-teal)'
        else if (stop.id === activeResult.destStop.id) color = 'var(--color-accent-warm)'
      } else if (currentRoute) {
        const servesStop = currentRoute.route_stops.some(rs => rs.stop_id === stop.id)
        if (servesStop) color = currentRoute.category?.color_hex || 'var(--color-accent-teal)'
      }

      return { stop, color, isSelected }
    })
}
