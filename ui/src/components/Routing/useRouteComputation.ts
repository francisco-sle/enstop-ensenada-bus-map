import { useEffect } from 'react'
import { useRoutingStore } from '../../store/routingStore'
import { computeABRoute, getNearbyStops } from './routing'
import { useRoutes } from '../../api/useRoutes'
import type { DBStop, RouteDetail } from '../../types'

const NEARBY_RADIUS_KM = 2.0

/**
 * Derives a human-readable error string for the current routing state.
 * Returns an empty string when routing is valid or not yet attempted.
 *
 * This is a pure derivation — it runs during render and never calls setState,
 * avoiding the warning pattern of `useEffect(() => setState(...), [deps])`.
 */
function deriveErrorMessage(
  origin: { lat: number; lng: number } | null,
  destination: { lat: number; lng: number } | null,
  stops: DBStop[]
): string {
  if (!origin || !destination) return ''

  if (origin.lat === destination.lat && origin.lng === destination.lng) {
    return 'El origen y el destino no pueden ser iguales.'
  }

  const oNearby = getNearbyStops(origin.lat, origin.lng, stops, NEARBY_RADIUS_KM)
  if (oNearby.length === 0) return 'No hay paradas de autobús a menos de 2 km del origen.'

  const dNearby = getNearbyStops(destination.lat, destination.lng, stops, NEARBY_RADIUS_KM)
  if (dNearby.length === 0) return 'No hay paradas de autobús a menos de 2 km del destino.'

  return ''
}

interface UseRouteComputationResult {
  /** Human-readable validation message; empty string when routing state is valid. */
  errorMsg: string
}

/**
 * Manages A→B route computation as a side effect of origin/destination state changes.
 * Also derives real-time validation error messages from the current routing state.
 *
 * - Automatically calls `setRoutingResults([])` when inputs are invalid.
 * - Runs `computeABRoute` when both endpoints are valid and route data is available.
 * - Consolidates the duplicated `getNearbyStops` calls that previously existed
 *   in both a `useEffect` and the render body of `RoutePlanner`.
 *
 * @param stops - Full stop list used for proximity lookups.
 * @returns `{ errorMsg }` — a derived validation string for display in the UI.
 *
 * @example
 * function RoutePlanner({ stops }) {
 *   const { errorMsg } = useRouteComputation(stops)
 *   return errorMsg ? <ErrorBanner msg={errorMsg} /> : null
 * }
 */
export function useRouteComputation(stops: DBStop[]): UseRouteComputationResult {
  const { origin, destination, setRoutingResults } = useRoutingStore()
  const { data: allRoutes } = useRoutes()

  useEffect(() => {
    if (!origin || !destination) {
      setRoutingResults([])
      return
    }

    if (origin.lat === destination.lat && origin.lng === destination.lng) {
      setRoutingResults([])
      return
    }

    if (!allRoutes) return

    const oNearby = getNearbyStops(origin.lat, origin.lng, stops, NEARBY_RADIUS_KM)
    const dNearby = getNearbyStops(destination.lat, destination.lng, stops, NEARBY_RADIUS_KM)

    if (oNearby.length === 0 || dNearby.length === 0) {
      setRoutingResults([])
      return
    }

    const results = computeABRoute(
      origin.lat, origin.lng,
      destination.lat, destination.lng,
      oNearby,
      dNearby,
      allRoutes as unknown as RouteDetail[]
    )

    setRoutingResults(results)
  }, [origin, destination, allRoutes, stops, setRoutingResults])

  const errorMsg = deriveErrorMessage(origin, destination, stops)

  return { errorMsg }
}
