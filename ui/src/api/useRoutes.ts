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
      'id, name, short_name, direction, is_active, category:categories(*), brand:brands(*), route_stops(*, stop:stops(*))',
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
      return metadata.map((route) => {
        const geom = geomMap.get(route.id) ?? null
        const coords = geom?.coordinates as [number, number][] | undefined
        const stops = route.route_stops
          ? [...route.route_stops].sort((a, b) => a.sequence - b.sequence)
          : []

        // Compute topological alignment: assign coord_index to each stop sequentially
        if (coords && stops.length > 0) {
          let searchIdx = 0
          for (const rs of stops) {
            const stopLng = rs.stop.geom.coordinates[0]
            const stopLat = rs.stop.geom.coordinates[1]

            let minSq = Infinity
            let bestIdx = searchIdx
            let increases = 0

            for (let i = searchIdx; i < coords.length; i++) {
              const dx = coords[i][0] - stopLng
              const dy = coords[i][1] - stopLat
              const sq = dx * dx + dy * dy

              if (sq < minSq) {
                minSq = sq
                bestIdx = i
                increases = 0 // reset on new minimum
              } else {
                increases++
              }

              // Local minimum lock: if distance increases consistently, we've passed it.
              if (increases > 30) {
                break
              }
            }

            rs.coord_index = bestIdx
            searchIdx = bestIdx // Continue searching from this coordinate for the next stop
          }
        }

        return {
          ...route,
          geom,
          route_stops: stops, // attach the mutated and sorted array
        }
      })
    },
  })
}
