import { useQuery } from '@tanstack/react-query'
import { supabase, supabaseUrl, supabaseAnonKey } from './supabase'
import type { RouteDetail } from '../types'

// Shape returned by the route-proxy Edge Function (geom is GeoJSON via ST_AsGeoJSON)
interface DegradedRoute {
  route_id: number
  geom: { type: string; coordinates: number[][] | number[][][] } | null
}

async function fetchDegradedGeometry(token: string): Promise<DegradedRoute[]> {
  const res = await fetch(`${supabaseUrl}/functions/v1/route-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Required by local Kong gateway; anon key is public by design.
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) {
    throw new Error(`route-proxy error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// Route metadata (name, color, stops, fares) — excludes geometry.
// Geometry always arrives via the Edge Function proxy.
async function fetchRoutesMetadata(): Promise<RouteDetail[]> {
  const { data, error } = await supabase
    .from('routes')
    .select(
      'id, name, short_name, direction, is_active, category:categories(*), route_stops(*, stop:stops(*))',
    )
    .eq('is_active', true)

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as RouteDetail[]
}

// ---------------------------------------------------------------------------
// useRoutes — always routes geometry through the Edge Function proxy.
// Requires `supabase functions serve` locally (or a deployed Edge Function in prod).
// Both metadata and geometry fetches run in parallel for performance.
// ---------------------------------------------------------------------------
export function useRoutes(turnstileToken: string | null) {
  return useQuery({
    queryKey: ['routes', !!turnstileToken],
    enabled: !!turnstileToken,
    queryFn: async (): Promise<RouteDetail[]> => {
      const [metadata, geometry] = await Promise.all([
        fetchRoutesMetadata(),
        fetchDegradedGeometry(turnstileToken!),
      ])

      const geomMap = new Map(geometry.map((g) => [g.route_id, g.geom]))
      return metadata.map((route) => ({
        ...route,
        geom: geomMap.get(route.id) ?? null,
      }))
    },
  })
}
