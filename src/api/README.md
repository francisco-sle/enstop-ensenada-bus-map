# `src/api` — Data Fetching Layer

All data access hooks live here. Each hook is a thin wrapper around a Supabase query or an external API call, returning React Query or local state.

## Files

| File | Purpose |
|---|---|
| `supabase.ts` | Supabase client singleton. Import this — never create a second client. |
| `useRoutes.ts` | Fetches all public transit routes (`RouteDetail[]`). |
| `useRoute.ts` | Fetches a single route by ID, including its `route_stops` relation. |
| `useRoutesForStop.ts` | Fetches all routes that serve a given stop ID. |
| `useStops.ts` | Fetches all stops (`DBStop[]`) from the `stops` table. |
| `useNearbyStops.ts` | Client-side proximity filter — wraps Turf `distance` to filter `DBStop[]` within a radius. |
| `useCurrentFare.ts` | Fetches the active fare record for a given route. |
| `usePhotonGeocoder.ts` | Debounced geocoding hook that queries the Photon API (Komoot) for address suggestions. Returns `PhotonResult[]`. Bounded to the Ensenada municipality bounding box. |

## Rules
- Never import `supabase` from anywhere else — always go through `supabase.ts`.
- Network calls should only happen inside hooks in this directory, not in components.
- All hooks in this directory that hit Supabase use `@tanstack/react-query` via a shared `QueryClient`.
