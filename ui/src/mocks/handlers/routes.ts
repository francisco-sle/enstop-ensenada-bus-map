import { http, HttpResponse } from 'msw'
import routesData from '../data/routes.json'
import stopsData from '../data/stops.json'

// Category mock
const mockCategory = {
  id: 1,
  name: 'Centro–Chapultepec',
  color_hex: '#3DBFA8'
}

// Map stops to route_stops for route 1
const mockRouteStops = stopsData.map((stop, index) => ({
  id: index + 1,
  route_id: 1,
  stop_id: stop.id,
  sequence: index + 1,
  stop: stop
}))

export const routesHandlers = [
  // Handle routes request
  http.get('*/rest/v1/routes', ({ request }) => {
    const url = new URL(request.url)
    const idParam = url.searchParams.get('id')

    if (idParam) {
      // e.g. "eq.1"
      const match = idParam.match(/eq\.(\d+)/)
      const routeId = match ? parseInt(match[1], 10) : null
      
      if (routeId === 1) {
        const routeDetail = {
          ...routesData[0],
          category: mockCategory,
          route_stops: mockRouteStops
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

    // Default: list all active routes
    const routesList = routesData.map(route => ({
      ...route,
      category: mockCategory
    }))
    
    return HttpResponse.json(routesList)
  })
]
