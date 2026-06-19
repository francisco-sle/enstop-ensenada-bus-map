import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export function useCurrentFare(
  routeId: number | null,
  passengerType: 'normal' | 'student_government' | 'student_highschool' | 'disability',
) {
  return useQuery({
    queryKey: ['currentFare', routeId, passengerType],
    queryFn: async () => {
      if (routeId === null) return null

      const { data, error } = await supabase.rpc('current_fare', {
        p_route_id: routeId,
        p_passenger_type: passengerType,
      })

      if (error) {
        throw new Error(error.message)
      }
      return data
    },
    enabled: routeId !== null,
  })
}
