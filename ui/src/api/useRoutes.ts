import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { RouteDetail } from '../types'

// Shape returned by the route-proxy Edge Function
interface DegradedRoute {
  route_id: number
  geom: unknown // GeoJSON geometry from PostGIS
}

async function fetchDegradedGeometry(token: string): Promise<DegradedRoute[]> {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/route-proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) {
    throw new Error(`route-proxy error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// Route metadata (name, color, stops, fares) — fetched directly from Supabase.
// In production, geom is excluded and arrives via the proxy instead.
// In dev-bypass mode the full join including geom is fetched directly.
async function fetchRoutesMetadata(includeFull: boolean): Promise<RouteDetail[]> {
  const select = includeFull
    ? '*, category:categories(*), route_stops(*, stop:stops(*))'
    : 'id, name, short_name, direction, is_active, category:categories(*), route_stops(*, stop:stops(*))'

  const { data, error } = await supabase.from('routes').select(select).eq('is_active', true)

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as RouteDetail[]
}

// ---------------------------------------------------------------------------
// useRoutes — in production, merges metadata + degraded geometry from proxy.
// In local dev (token === 'dev-bypass'), falls back to a direct Supabase query
// so the app works without the Edge Function environment variables.
// ---------------------------------------------------------------------------
export function useRoutes(turnstileToken: string | null) {
  const isDevBypass = turnstileToken === 'dev-bypass'

  return useQuery({
    queryKey: ['routes', !!turnstileToken],
    enabled: !!turnstileToken,
    queryFn: async (): Promise<RouteDetail[]> => {
      // Dev / mock mode — bypass proxy, fetch full route data directly
      if (isDevBypass) {
        return fetchRoutesMetadata(true)
      }

      // Production — merge metadata + degraded geometry from Edge Function
      const [metadata, geometry] = await Promise.all([
        fetchRoutesMetadata(false),
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
