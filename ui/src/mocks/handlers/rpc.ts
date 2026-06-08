import { http, HttpResponse } from 'msw'
import stopsData from '../data/stops.json'
import routesData from '../data/routes.json'
import faresData from '../data/fares.json'

// Haversine distance formula
function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const rpcHandlers = [
  // RPC: nearby_stops(lat, lng, radius_meters)
  http.post('*/rest/v1/rpc/nearby_stops', async ({ request }) => {
    const body = (await request.json()) as { lat: number; lng: number; radius_meters?: number }
    const { lat, lng, radius_meters = 500 } = body

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return HttpResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const stopsWithDistance = stopsData
      .map(stop => {
        const [stopLng, stopLat] = stop.geom.coordinates
        const dist = getDistanceMeters(lat, lng, stopLat, stopLng)
        return { ...stop, distance: dist }
      })
      .filter(stop => stop.distance <= radius_meters)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20)

    // Remove the calculated distance property to match DB signature
    const result = stopsWithDistance.map(s => {
      const stopCopy: Partial<typeof s> = { ...s }
      delete stopCopy.distance
      return stopCopy
    })

    return HttpResponse.json(result)
  }),

  // RPC: routes_for_stop(p_stop_id)
  http.post('*/rest/v1/rpc/routes_for_stop', async ({ request }) => {
    const body = (await request.json()) as { p_stop_id: number }
    const { p_stop_id } = body

    if (typeof p_stop_id !== 'number') {
      return HttpResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const matchingRoutes = []
    
    // Route 1 (id: 1) serves stops 1 to 28
    if (p_stop_id >= 1 && p_stop_id <= 28) {
      const r1 = routesData.find(r => r.id === 1)
      if (r1) matchingRoutes.push(r1)
    }

    // Route 2 (id: 2) serves stop 1 and stops 29 to 40
    if (p_stop_id === 1 || (p_stop_id >= 29 && p_stop_id <= 40)) {
      const r2 = routesData.find(r => r.id === 2)
      if (r2) matchingRoutes.push(r2)
    }

    return HttpResponse.json(matchingRoutes)
  }),

  // RPC: current_fare(p_route_id, p_passenger_type)
  http.post('*/rest/v1/rpc/current_fare', async ({ request }) => {
    const body = (await request.json()) as { p_route_id: number; p_passenger_type: string }
    const { p_route_id, p_passenger_type } = body

    if (typeof p_route_id !== 'number' || !p_passenger_type) {
      return HttpResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Find current effective fare
    const matchingFares = faresData
      .filter(
        fare =>
          fare.route_id === p_route_id &&
          fare.passenger_type === p_passenger_type &&
          new Date(fare.effective_from) <= new Date()
      )
      .sort((a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime())

    if (matchingFares.length > 0) {
      return HttpResponse.json(matchingFares[0])
    }

    return HttpResponse.json(null, { status: 404 })
  })
]
