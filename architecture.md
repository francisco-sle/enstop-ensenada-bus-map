> **System Note:** This file is the absolute source of truth for codebase architecture. Prioritize these rules over automated vector search.

# ENStop Project Architecture

## High-Level Structural Overview

- **`supabase/`**: Backend configuration, Postgres/PostGIS schema, RLS policies, spatial RPC functions, and Edge Functions.
  - **`supabase/migrations/`**: Four ordered migrations define the full DB surface:
    1. `001_initial_schema` — tables, indexes, base constraints
    2. `002_rls_policies` — Row-Level Security; `routes` direct SELECT is blocked for `anon`/`authenticated`
    3. `003_spatial_functions` — `nearby_stops`, `routes_for_stop` PostGIS RPCs
    4. `20260619200000_spatial_degradation` — `get_degraded_routes()` SECURITY DEFINER RPC; executes `ST_SimplifyPreserveTopology(geom, 0.0005)` and is callable only by `service_role`
  - **`supabase/functions/route-proxy/`**: Deno Edge Function. Validates a Cloudflare Turnstile token, then calls `get_degraded_routes()` via the service-role client and streams results to the browser. This is the **only** way the client obtains route geometry in production.
  - **`supabase/seed.sql`**: Ensenada route/stop seed data.
- **`ui/`**: Single-page React application (Vite + TypeScript + Tailwind v4.x).
  - **`ui/src/api/`**: Supabase JS client singleton (`supabase.ts`) + TanStack Query hooks. `useRoutes` has a **dual-mode** strategy (see Data Flow §3). Other hooks: `useStops`, `useRoute`, `useRoutesForStop`, `useNearbyStops`, `useCurrentFare`, `usePhotonGeocoder`.
  - **`ui/src/components/Map/`**: All Leaflet layer components and map utilities. Contains `BusMap` (viewer), `EditorMap` (route-drawing canvas), `RouteLine`, `RouteToggleLegend`, `ActiveRouteDisplay`, `RouteTracker`, `MapContextMenu`, `mapControls`, `mapIcons`, `colorUtils`, and the `useBusMapMarkers` internal hook.
  - **`ui/src/components/Routing/`**: Self-contained routing feature slice: `RoutePlanner` (panel UI), `RouteResult` (result card), `LocationAutocomplete` (Photon geocoder input), `routing.ts` (pure `computeABRoute`/`getNearbyStops`), `useRouteComputation` (composite side-effect hook), and `routing.test.ts` (Vitest unit tests).
  - **`ui/src/components/StopDetail/`**: `StopDrawer` — slide-up panel for a selected stop's route list.
  - **`ui/src/components/RouteDetail/`**: `FareTable` — tabular fare display for a route.
  - **`ui/src/components/RouteThumbnail.tsx`**: Reusable small route card (color chip + name) used in list views.
  - **`ui/src/constants/`**: Shared static values. `fares.ts` exports fare-related constants consumed by `useCurrentFare` and `FareTable`.
  - **`ui/src/hooks/`**: Cross-cutting custom hooks — `useOsrmRoute` (road-snap via OSRM Match/Route API with RDP simplification and overshoot pruning), `useSnappedPolyline`, `useUrlStoreSync` (bidirectional `routingStore` ↔ URL query-param sync).
  - **`ui/src/mocks/`**: MSW (Mock Service Worker) layer for offline/CI development. `browser.ts` and `node.ts` bootstrap the mock server; `handlers/` contains per-endpoint response stubs; `data/` holds static JSON fixtures; `scripts/` has generation utilities.
  - **`ui/src/pages/`**: Top-level route screens — `MapPage`, `RoutesPage`, `RouteDetailPage`, `AboutPage`, `EditorPage` (admin-only route drawing/editing canvas at `/studio`).
  - **`ui/src/store/`**: Zustand global client state (see below).
  - **`ui/src/styles/`**: `index.css` — single CSS entry point containing `@import "tailwindcss"`, `@theme` token overrides, custom utilities, and third-party (Leaflet) style overrides. **No `tailwind.config.js` exists or should ever be created.**
  - **`ui/src/types/`**: `index.ts` exports domain model aliases (`DBRoute`, `DBStop`, `RouteDetail`, `RoutingResult`, etc.) and `supabase-generated.ts` (auto-generated via `npm run db:types`).
- **`scripts/dev-local.sh`**: Starts Supabase local stack then launches the Vite dev server (`npm run dev:local`).

## Tech Stack & Global State

- **Frontend Core**: React 19 + TypeScript 6 + Vite 8.
- **Styling**: Tailwind CSS v4.x (CSS-first; all tokens live in `@theme` inside `ui/src/styles/index.css`). No `tailwind.config.js`.
- **Map Rendering**: Leaflet 1.9 + react-leaflet 5 + `leaflet-polylinedecorator`. Spatial utilities via `@turf/turf`.
- **Database & Auth**: Supabase JS v2 (`@supabase/supabase-js`) → Postgres 15 + PostGIS backend.
- **Remote Data**: TanStack React Query v5 — all server state managed via hooks in `ui/src/api/`.
- **Bot Protection**: Cloudflare Turnstile (`@marsidev/react-turnstile`). In production, a valid Turnstile token is required before any route geometry is fetched. In local dev (no `VITE_TURNSTILE_SITE_KEY` env var), the app self-issues a `'dev-bypass'` token, skipping the widget entirely.
- **Global Client State (Zustand v5)**:
  - `useMapStore`: Viewport center/zoom, selected stop/route IDs, user geolocation, `hiddenRouteIds` Set for filter visibility. Default center `[31.83, -116.60]` (Ensenada).
  - `useRoutingStore`: Origin/destination pins (with labels), computed `RoutingResult[]`, `selectedResultIndex`, `mapClickMode` (`'origin' | 'destination' | null`), and panel minimize state.
- **App Routing**: React Router DOM v6 — routes: `/map`, `/routes`, `/routes/:routeId`, `/about`, `/studio`.
- **Testing**: Vitest (unit, incl. `routing.test.ts`), Playwright (e2e under `ui/e2e/`).
- **Mocking**: MSW v2 — activated via `--mode mock` (`npm run dev:mock` / `npm run build:mock`).
- **Icons**: `lucide-react`.
- **Geocoding**: Photon API (via `usePhotonGeocoder`) for location autocomplete.
- **Road Snapping**: OSRM public API (`router.project-osrm.org`) — Match API (primary) → Route API (fallback), used by `useOsrmRoute` in the Editor.

## Data Flow

1. **Bot Gate**: `App.tsx` (`MainAppShell`) checks for `VITE_TURNSTILE_SITE_KEY`. If present, the Turnstile widget renders and all data fetches are `enabled: false` until a valid token is received. If absent (local dev), `turnstileToken` is immediately set to `'dev-bypass'`.
2. **Server Data**: `App.tsx` fetches `useRoutes(turnstileToken)` and `useStops()` at the shell level, passing results as props into `MapPage` and `RoutesPage` to avoid duplicate network requests.
3. **`useRoutes` Dual-Mode Strategy**:
   - **Dev-bypass** (`turnstileToken === 'dev-bypass'`): Single Supabase query fetching full route data including geometry directly. No Edge Function involved.
   - **Production**: Two parallel fetches — `fetchRoutesMetadata` (direct Supabase, geom column excluded) + `fetchDegradedGeometry` (POST to `/functions/v1/route-proxy` with the Turnstile token). Results are merged by `route_id` into the final `RouteDetail[]`.
4. **Geometry Degradation Pipeline** (production only): Browser → `route-proxy` Edge Function (validates Turnstile token) → calls `get_degraded_routes()` via service-role client → PostGIS `ST_SimplifyPreserveTopology(geom, 0.0005)` → returns simplified GeoJSON. RLS on `routes` prevents direct geometry access by `anon`/`authenticated` roles.
5. **Spatial RPCs**: Stop proximity and route-for-stop queries hit Supabase RPC functions (`nearby_stops`, `routes_for_stop`) that execute PostGIS geographic calculations server-side.
6. **Client-side Routing Algorithm**: `useRouteComputation(stops)` reacts to `origin`/`destination` changes in `useRoutingStore`. It calls the pure `computeABRoute` function (candidate stop cross-join → sequence-direction validation → index-based geometry slicing → Turf distance/time scoring), then writes results back via `setRoutingResults`.
7. **URL ↔ Store Sync**: `useUrlStoreSync` (mounted in `MapPage`) mirrors `useRoutingStore` coordinates to `?from=lat,lng&to=lat,lng` query params and rehydrates the store on page load and `popstate` events.
8. **Map Render Loop**: Leaflet overlays (`BusMap`) combine OSM base tiles with database-sourced route polylines and stop markers, gated by `hiddenRouteIds` from `useMapStore` and selection highlights from `selectedStopId`/`selectedRouteId`.
9. **Editor Flow** (`/studio`): `EditorPage` uses `EditorMap` for freehand route-path drawing. Drawn coordinates are submitted to `useOsrmRoute.snapCoordinates`, which applies RDP simplification → overshoot pruning → OSRM road-snap before the route geometry is persisted to Supabase. No Turnstile gate on `/studio`.
10. **Fare Lookup**: `RouteDetailPage` composes `useCurrentFare` (Supabase query filtered by passenger type) and `FareTable` to render a live fare matrix per route. Static fare constants live in `ui/src/constants/fares.ts`.
