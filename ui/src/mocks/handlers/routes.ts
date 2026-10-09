import { http, HttpResponse } from 'msw'
import { stopsData, routesData, routeStopsData } from '../data/network'
import categoriesData from '../data/categories.json'
import brandsData from '../data/brands.json'

const categoriesById = new Map(categoriesData.map((c) => [c.id, c]))
const brandsById = new Map(brandsData.map((b) => [b.id, b]))
const stopsById = new Map(stopsData.map((s) => [s.id, s]))

// Ordered stops for a route, joined with their stop rows (PostgREST embed shape)
function getRouteStops(routeId: number) {
  return routeStopsData
    .filter((rs) => rs.route_id === routeId)
    .sort((a, b) => a.sequence - b.sequence)
    .map((rs) => ({ ...rs, stop: stopsById.get(rs.stop_id)! }))
}

function withRelations(route: (typeof routesData)[number]) {
  return {
    ...route,
    category: categoriesById.get(route.category_id) ?? null,
    brand: brandsById.get(route.brand_id) ?? null,
    route_stops: getRouteStops(route.id),
  }
}

export const routesHandlers = [
  // Handle Edge Function route-proxy for geometries
  http.post('*/functions/v1/route-proxy', () => {
    const degradedGeometries = routesData.map((route) => ({
      route_id: route.id,
      geom: route.geom || null,
    }))
    return HttpResponse.json(degradedGeometries)
  }),

  // Handle routes request
  http.get('*/rest/v1/routes', ({ request }) => {
    const url = new URL(request.url)
    const idParam = url.searchParams.get('id')

    if (idParam) {
      // e.g. "eq.1"
      const match = idParam.match(/eq\.(\d+)/)
      const routeId = match ? parseInt(match[1], 10) : null

      const route = routesData.find((r) => r.id === routeId)
      if (route) {
        const routeDetail = withRelations(route)

        // If it's querying for a single row specifically (e.g. .single() which sets header Accept: application/vnd.pgrst.object+json)
        const acceptHeader = request.headers.get('Accept')
        if (acceptHeader && acceptHeader.includes('application/vnd.pgrst.object+json')) {
          return HttpResponse.json(routeDetail)
        }

        // Otherwise, standard query returns list
        return HttpResponse.json([routeDetail])
      }

      return HttpResponse.json([], { status: 404 })
    }

    // Default: list all active routes — include route_stops so consumers get RouteDetail shape
    const routesList = routesData.map(withRelations)

    return HttpResponse.json(routesList)
  }),
]
