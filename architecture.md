> **System Note:** This file is the absolute source of truth for codebase architecture. Prioritize these rules over automated vector search.

# ENStop Project Architecture

## High-Level Structural Overview

- **`supabase/`**: Backend configuration, Postgres/PostGIS schema, RLS policies, and spatial RPC functions. Three ordered migrations define the full database surface (`initial_schema` → `rls_policies` → `spatial_functions`). The `seed.sql` file populates Ensenada route/stop data.
- **`ui/`**: Single-page React application (Vite + TypeScript + Tailwind v4.x).
  - **`ui/src/api/`**: Supabase JS client singleton (`supabase.ts`) plus TanStack Query hooks — one file per entity (`useRoutes`, `useStops`, `useRoute`, `useRoutesForStop`, `useNearbyStops`, `useCurrentFare`, `usePhotonGeocoder`).
  - **`ui/src/components/Map/`**: All Leaflet layer components and map utilities. Contains `BusMap` (viewer), `EditorMap` (route-drawing canvas), `RouteLine`, `RouteToggleLegend`, `ActiveRouteDisplay`, `RouteTracker`, `MapContextMenu`, `mapControls`, `mapIcons`, `colorUtils`, and the `useBusMapMarkers` internal hook.
  - **`ui/src/components/Routing/`**: Self-contained routing feature slice: `RoutePlanner` (panel UI), `RouteResult` (result card), `LocationAutocomplete` (Photon geocoder input), `routing.ts` (pure `computeABRoute`/`getNearbyStops` functions), `useRouteComputation` (composite side-effect hook), and `routing.test.ts` (Vitest unit tests).
  - **`ui/src/components/StopDetail/`**: `StopDrawer` — slide-up panel for a selected stop's route list.
  - **`ui/src/components/RouteDetail/`**: `FareTable` — tabular fare display for a route.
  - **`ui/src/components/RouteThumbnail.tsx`**: Reusable small route card (color chip + name) used in list views.
  - **`ui/src/hooks/`**: Cross-cutting custom hooks — `useOsrmRoute` (road-snap via OSRM Match/Route API with RDP simplification and overshoot pruning), `useSnappedPolyline`, `useUrlStoreSync` (bidirectional `routingStore` ↔ URL query-param sync).
  - **`ui/src/mocks/`**: MSW (Mock Service Worker) layer for offline/CI development. `browser.ts` and `node.ts` bootstrap the mock server; `handlers/` contains per-endpoint response stubs; `data/` holds static JSON fixtures; `scripts/` has generation utilities.
  - **`ui/src/pages/`**: Top-level route screens — `MapPage`, `RoutesPage`, `RouteDetailPage`, `AboutPage`, `EditorPage` (admin-only route drawing/editing canvas, accessed at `/studio`).
  - **`ui/src/store/`**: Zustand global client state (see below).
  - **`ui/src/styles/`**: `index.css` — single CSS entry point containing `@import "tailwindcss"`, `@theme` token overrides, custom utilities, and third-party (Leaflet) style overrides. **No `tailwind.config.js` exists.**
  - **`ui/src/types/`**: `index.ts` exports domain model aliases (`DBRoute`, `DBStop`, `RouteDetail`, `RoutingResult`, etc.) and `supabase-generated.ts` (auto-generated via `npm run db:types`).

## Tech Stack & Global State

- **Frontend Core**: React 19 + TypeScript 6 + Vite 8.
- **Styling**: Tailwind CSS v4.x (CSS-first; all tokens live in `@theme` inside `ui/src/styles/index.css`).
- **Map Rendering**: Leaflet 1.9 + react-leaflet 5 + `leaflet-polylinedecorator`. Spatial utilities via `@turf/turf`.
- **Database & Auth**: Supabase JS v2 (`@supabase/supabase-js`) → Postgres 15 + PostGIS backend.
- **Remote Data**: TanStack React Query v5 — all server state managed via hooks in `ui/src/api/`.
- **Global Client State (Zustand v5)**:
  - `useMapStore`: Viewport center/zoom, selected stop/route IDs, user geolocation, `hiddenRouteIds` Set for filter visibility. Default center `[31.83, -116.60]` (Ensenada).
  - `useRoutingStore`: Origin/destination pins (with labels), computed `RoutingResult[]`, `selectedResultIndex`, `mapClickMode` (`'origin' | 'destination' | null`), and panel minimize state.
- **App Routing**: React Router DOM v6 — routes: `/map`, `/routes`, `/routes/:routeId`, `/about`, `/studio`.
- **Testing**: Vitest (unit, incl. `routing.test.ts`), Playwright (e2e under `ui/e2e/`).
- **Mocking**: MSW v2 — activated via `VITE_USE_MOCKS=true` (`npm run dev:mock` / `npm run build:mock`).
- **Icons**: `lucide-react`.
- **Geocoding**: Photon API (via `usePhotonGeocoder`) for location autocomplete.
- **Road Snapping**: OSRM public API (`router.project-osrm.org`) — Match API (primary) → Route API (fallback), used by `useOsrmRoute` in the Editor.

## Data Flow

1. **Server Data**: `App.tsx` fetches `useRoutes` and `useStops` at the shell level, passing results as props into `MapPage` and `RoutesPage` to avoid duplicate network requests.
2. **Spatial RPCs**: Stop proximity and route-for-stop queries hit Supabase RPC functions (`nearby_stops`, `routes_for_stop`) that execute PostGIS geographic calculations server-side.
3. **Client-side Routing Algorithm**: `useRouteComputation(stops)` reacts to `origin`/`destination` changes in `useRoutingStore`. It calls the pure `computeABRoute` function (candidate stop cross-join → sequence-direction validation → index-based geometry slicing → Turf distance/time scoring), then writes results back via `setRoutingResults`.
4. **URL ↔ Store Sync**: `useUrlStoreSync` (mounted in `MapPage`) mirrors `useRoutingStore` coordinates to `?from=lat,lng&to=lat,lng` query params and rehydrates the store on page load and `popstate` events.
5. **Map Render Loop**: Leaflet overlays (`BusMap`) combine OSM base tiles with database-sourced route polylines and stop markers, gated by `hiddenRouteIds` from `useMapStore` and selection highlights from `selectedStopId`/`selectedRouteId`.
6. **Editor Flow** (`/studio`): `EditorPage` uses `EditorMap` for freehand route-path drawing. Drawn coordinates are submitted to `useOsrmRoute.snapCoordinates`, which applies RDP simplification → overshoot pruning → OSRM road-snap before the route geometry is persisted to Supabase.
7. **Fare Lookup**: `RouteDetailPage` composes `useCurrentFare` (Supabase query filtered by passenger type) and `FareTable` to render a live fare matrix per route.
