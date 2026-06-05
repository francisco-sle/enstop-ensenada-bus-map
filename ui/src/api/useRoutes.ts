import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export function useRoutes() {
  return useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('*, category:categories(*)')
        .eq('is_active', true)

      if (error) {
        throw new Error(error.message)
      }
      return data
    }
  })
}
