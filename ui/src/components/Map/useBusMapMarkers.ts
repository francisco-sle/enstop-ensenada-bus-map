import type { DBStop, RouteDetail } from '../../types'
import type { RoutingResult } from '../../types'

interface BusMapMarkersOptions {
  allStops: DBStop[]
  activeRoutes: RouteDetail[]
  selectedStopId: number | null
  selectedRouteId: number | null
  activeResult: RoutingResult | null
  currentZoom: number
  visibleRouteIds: Set<number>
}

interface StopMarkerData {
  stop: DBStop
  color: string
  isSelected: boolean
}

/**
 * Computes a per-stop importance score to drive weighted Level-of-Detail rendering.
 *
 * Score components:
 *   +50  is_terminal
 *   +20  accessible
 *   +10  per route serving the stop
 *   +30  transfer point (served by ≥2 routes)
 *
 * Threshold per zoom:
 *   ≤12 → 70  (terminals only in practice)
 *   ≤13 → 50  (terminals + high-value stops)
 *   ≤14 → 20  (terminals + accessible + transfer points)
 *   ≥15 → 0   (all stops)
 */
function stopImportance(stop: DBStop, routeCount: number): number {
  let score = 0
  if (stop.is_terminal) score += 50
  if (stop.accessible) score += 20
  score += routeCount * 10
  if (routeCount >= 2) score += 30
  return score
}

function importanceThreshold(zoom: number): number {
  if (zoom <= 12) return 70
  if (zoom <= 13) return 50
  if (zoom <= 14) return 20
  return 0
}

/**
 * Derives the list of stops to render as map markers, applying:
 *   1. Hidden-route suppression — stops exclusively on hidden routes are removed.
 *   2. Weighted Level-of-Detail filtering based on importance score × zoom threshold.
 *   3. Pin color coding based on selection, routing context, or active route.
 *
 * @param options.allStops       - Full stops array from the store.
 * @param options.activeRoutes   - Routes currently drawn on the map.
 * @param options.selectedStopId - ID of the currently selected stop (always shown).
 * @param options.selectedRouteId - ID of the currently highlighted route.
 * @param options.activeResult   - Active routing suggestion (origin/dest stops always shown).
 * @param options.currentZoom    - Current Leaflet zoom level.
 * @param options.visibleRouteIds - Set of route IDs whose stops should be shown.
 * @returns Array of `{ stop, color, isSelected }` ready to pass to `createStopIcon`.
 */
export function useBusMapMarkers({
  allStops,
  activeRoutes,
  selectedStopId,
  selectedRouteId,
  activeResult,
  currentZoom,
  visibleRouteIds,
}: BusMapMarkersOptions): StopMarkerData[] {
  const currentRoute = selectedRouteId
    ? (activeRoutes.find((r) => r.id === selectedRouteId) ?? null)
    : null

  const threshold = importanceThreshold(currentZoom)

  // Normalize route_stops once at entry — guards against partial fetches where the
  // join was omitted. All downstream .some() calls are then unconditionally safe.
  const routeStopsMap = new Map(activeRoutes.map((r) => [r.id, r.route_stops ?? []]))

  return allStops
    .filter((stop) => {
      // Priority 1: always show the selected stop
      if (stop.id === selectedStopId) return true

      // Priority 2: always show active routing endpoints
      if (
        activeResult &&
        (stop.id === activeResult.originStop.id || stop.id === activeResult.destStop.id)
      )
        return true

      // Compute which visible routes serve this stop
      const servingRoutes = activeRoutes.filter(
        (r) =>
          visibleRouteIds.has(r.id) &&
          (routeStopsMap.get(r.id) ?? []).some((rs) => rs.stop_id === stop.id),
      )

      // Suppress stops that are only on hidden routes (and not selected/routing endpoints)
      const allServingRoutes = activeRoutes.filter((r) =>
        (routeStopsMap.get(r.id) ?? []).some((rs) => rs.stop_id === stop.id),
      )
      if (allServingRoutes.length > 0 && servingRoutes.length === 0) return false

      // Also suppress orphan stops (stops that aren't assigned to ANY route in the database)
      if (allServingRoutes.length === 0) return false

      // Weighted LoD — use visible route count for scoring
      const score = stopImportance(stop, servingRoutes.length)
      return score >= threshold
    })
    .map((stop) => {
      const isSelected = stop.id === selectedStopId
      let color = '#2563EB' // default blue

      if (isSelected) {
        color = 'var(--color-accent-warm)'
      } else if (activeResult) {
        if (stop.id === activeResult.originStop.id) color = 'var(--color-accent-cerulean)'
        else if (stop.id === activeResult.destStop.id) color = 'var(--color-accent-warm)'
      } else if (currentRoute) {
        const servesStop = (routeStopsMap.get(currentRoute.id) ?? []).some(
          (rs) => rs.stop_id === stop.id,
        )
        if (servesStop) color = currentRoute.category?.color_hex || 'var(--color-accent-cerulean)'
      }

      return { stop, color, isSelected }
    })
}
