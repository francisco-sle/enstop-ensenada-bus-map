import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export function useRoutesForStop(stopId: number | null) {
  return useQuery({
    queryKey: ['routesForStop', stopId],
    queryFn: async () => {
      if (stopId === null) return []

      const { data, error } = await supabase.rpc('routes_for_stop', {
        p_stop_id: stopId
      })

      if (error) {
        throw new Error(error.message)
      }
      return data
    },
    enabled: stopId !== null
  })
}
