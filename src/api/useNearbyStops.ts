import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export function useNearbyStops(lat: number | null, lng: number | null, radiusMeters: number = 500) {
  return useQuery({
    queryKey: ['nearbyStops', lat, lng, radiusMeters],
    queryFn: async () => {
      if (lat === null || lng === null) return []
      
      const { data, error } = await supabase.rpc('nearby_stops', {
        lat,
        lng,
        radius_meters: radiusMeters
      })

      if (error) {
        throw new Error(error.message)
      }
      return data
    },
    enabled: lat !== null && lng !== null
  })
}
