import type { RouteWithCategory } from '../../types'
import type { ViewBounds } from '../../store/mapStore'

/** Route name without the operator prefix ("Rojo y Blanco — Centro–X" → "Centro–X"). */
export function routeDisplayName(route: RouteWithCategory): string {
  return route.name.split('—')[1]?.trim() || route.name
}

/** Lowercases and strips accents so "vigia" matches "Vigía". */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** True when every word of the query appears in the route's number, name, operator or corridor. */
export function routeMatchesQuery(route: RouteWithCategory, query: string): boolean {
  const words = normalizeText(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = normalizeText(
    [route.short_name, route.name, route.brand?.name, route.category?.name, route.description]
      .filter(Boolean)
      .join(' '),
  )
  return words.every((w) => haystack.includes(w))
}

/** True when any vertex of the route's line falls inside the bounds. */
export function routeInBounds(route: RouteWithCategory, bounds: ViewBounds): boolean {
  const [[south, west], [north, east]] = bounds
  const coords = (route.geom?.coordinates ?? []) as [number, number][]
  return coords.some(([lng, lat]) => lat >= south && lat <= north && lng >= west && lng <= east)
}
