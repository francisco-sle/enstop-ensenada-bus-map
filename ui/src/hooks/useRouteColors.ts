import { useMemo } from 'react'
import { useMapStore } from '../store/mapStore'
import { assignRouteColors } from '../components/Map/routeColors'
import type { RouteWithCategory } from '../types'

/**
 * Colors for the routes currently shown on the map, keyed by route id.
 * `extraIds` (e.g. a route focused from a stop) are colored after the user's
 * picks so they never steal a picked route's color.
 */
export function useRouteColors(
  routes: RouteWithCategory[],
  extraIds: number[] = [],
): Map<number, string> {
  const shownRouteIds = useMapStore((s) => s.shownRouteIds)
  const extraKey = extraIds.join(',')

  return useMemo(() => {
    const routesById = new Map(routes.map((r) => [r.id, r]))
    const extras = extraKey ? extraKey.split(',').map(Number) : []
    return assignRouteColors([...shownRouteIds, ...extras], routesById)
  }, [routes, shownRouteIds, extraKey])
}
