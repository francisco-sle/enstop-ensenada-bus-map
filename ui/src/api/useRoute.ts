import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export function useRoute(id: number) {
  return useQuery({
    queryKey: ['route', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select(
          `
          *,
          category:categories(*),
          route_stops (
            id,
            route_id,
            stop_id,
            sequence,
            stop:stops (*)
          )
        `,
        )
        .eq('id', id)
        .order('sequence', { foreignTable: 'route_stops', ascending: true })
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    enabled: !!id,
  })
}
