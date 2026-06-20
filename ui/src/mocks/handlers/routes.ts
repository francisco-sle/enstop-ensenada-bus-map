import { http, HttpResponse } from 'msw'
import routesData from '../data/routes.json'
import stopsData from '../data/stops.json'

// Category mock
const mockCategories: Record<number, { id: number; name: string; color_hex: string }> = {
  1: {
    id: 1,
    name: 'Centro–Chapultepec',
    color_hex: '#3DBFA8',
  },
  2: {
    id: 2,
    name: 'Esmeralda–Calafia',
    color_hex: '#F59E0B',
  },
}

// Map stops for each route
function getRouteStops(routeId: number) {
  const stopIds =
    routeId === 1
      ? Array.from({ length: 28 }, (_, i) => i + 1)
      : [1, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]

  return stopIds.map((stopId, index) => {
    const stop = stopsData.find((s) => s.id === stopId)
    return {
      id: (routeId === 1 ? 0 : 100) + index + 1,
      route_id: routeId,
      stop_id: stopId,
      sequence: index + 1,
      stop: stop!,
    }
  })
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
        const routeDetail = {
          ...route,
          category: mockCategories[route.category_id || 1] || null,
          route_stops: getRouteStops(route.id),
        }

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
    const routesList = routesData.map((route) => ({
      ...route,
      category: mockCategories[route.category_id || 1] || null,
      route_stops: getRouteStops(route.id),
    }))

    return HttpResponse.json(routesList)
  }),
]
