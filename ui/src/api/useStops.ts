import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export function useStops() {
  return useQuery({
    queryKey: ['stops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stops')
        .select('*')

      if (error) {
        throw new Error(error.message)
      }
      return data
    }
  })
}
