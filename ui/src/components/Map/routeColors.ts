import type { RouteWithCategory } from '../../types'

const DEFAULT_ROUTE_COLOR = '#3DBFA8'

/**
 * Fallback hues for routes whose operator color is already taken on the map.
 * Picked to stay clear of the six operator liveries (red, yellow, blue, orange,
 * green, gray) and to hold contrast on both the light and dark basemaps.
 * Length ≥ MAX_SHOWN_ROUTES - 1, so a clash can always be resolved.
 */
export const COMPARE_PALETTE = ['#8b5cf6', '#ec4899', '#0d9488', '#a16207', '#4f46e5']

/** Operator livery color, falling back to the category color. */
export function routeBaseColor(route: RouteWithCategory): string {
  return route.brand?.color_hex || route.category?.color_hex || DEFAULT_ROUTE_COLOR
}

/**
 * Assigns each shown route a color that no other shown route uses.
 * Routes keep their operator color unless an earlier pick already claimed it,
 * in which case they take the next free compare color. Order matters: the
 * first route picked always keeps its livery.
 */
export function assignRouteColors(
  routeIds: number[],
  routesById: Map<number, RouteWithCategory>,
): Map<number, string> {
  const assigned = new Map<number, string>()
  const used = new Set<string>()

  for (const id of routeIds) {
    const route = routesById.get(id)
    if (!route || assigned.has(id)) continue
    const base = routeBaseColor(route).toLowerCase()
    const color = used.has(base) ? (COMPARE_PALETTE.find((c) => !used.has(c)) ?? base) : base
    assigned.set(id, color)
    used.add(color)
  }
  return assigned
}
