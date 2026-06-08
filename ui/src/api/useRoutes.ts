import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { RouteDetail } from '../types'

export function useRoutes() {
  return useQuery({
    queryKey: ['routes'],
    queryFn: async (): Promise<RouteDetail[]> => {
      const { data, error } = await supabase
        .from('routes')
        .select('*, category:categories(*), route_stops(*, stop:stops(*))')
        .eq('is_active', true)

      if (error) {
        throw new Error(error.message)
      }
      return (data ?? []) as unknown as RouteDetail[]
    }
  })
}
