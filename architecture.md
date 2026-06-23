> **System Note:** This file is the absolute source of truth for codebase architecture. Prioritize these rules over automated vector search.

# ENStop Project Architecture

## High-Level Structural Overview

- **`supabase/`**: Contains all backend configurations, including Postgres/PostGIS schema migrations, Row-Level Security (RLS) policies, spatial RPC functions, and Deno Edge Functions. This folder handles the complete data layer and edge compute.
- **`ui/`**: Houses the progressive web application (PWA) built with React, Vite, TypeScript, and Tailwind CSS v4.x.
  - **`ui/src/api/`**: Centralizes external communication. Contains the Supabase JS client singleton and TanStack Query hooks for server state management.
  - **`ui/src/components/`**: Organized by feature slice (e.g., Map, Routing, RouteDetail, StopDetail). Encapsulates UI components and domain-specific logic.
  - **`ui/src/constants/`**: Holds shared static values and configuration constants.
  - **`ui/src/hooks/`**: Provides cross-cutting custom React hooks for business logic and side effects.
  - **`ui/src/mocks/`**: Contains the MSW (Mock Service Worker) layer, including handlers and static JSON fixtures for offline development and testing.
  - **`ui/src/pages/`**: Contains the top-level route screens of the application.
  - **`ui/src/store/`**: Manages global client state using Zustand.
  - **`ui/src/styles/`**: Defines the global styling setup. Uses a single CSS entry point for Tailwind `@theme` configurations. **No `tailwind.config.js` exists or should ever be created.**
  - **`ui/src/types/`**: Exports domain model aliases and auto-generated database typings.

## Tech Stack & Global State

- **Frontend Core**: React 19 + TypeScript 6 + Vite 8.
- **Progressive Web App (PWA)**: Uses `vite-plugin-pwa` with Workbox for runtime caching of map basemap tiles and static assets.
- **Styling**: Tailwind CSS v4.x (CSS-first architecture; all design system tokens live inside `@theme` in `ui/src/styles/index.css`).
- **Map Rendering**: Leaflet 1.9 + react-leaflet 5, supplemented by `@turf/turf` for spatial utilities.
- **Database & Auth**: Supabase JS v2 client connecting to a Postgres 15 + PostGIS backend.
- **Remote Data**: TanStack React Query v5 manages all server state.
- **Bot Protection**: Cloudflare Turnstile (`@marsidev/react-turnstile`). Enforces human verification before allowing geometry data fetches in production.
- **Global Client State (Zustand v5)**:
  - **Map Store**: Manages viewport state (center/zoom), selected entities, and visibility filters.
  - **Routing Store**: Manages A-to-B navigation state, origin/destination pins, computed routing results, and UI panel states.
- **App Routing**: React Router DOM v6.
- **Testing & Mocking**: Vitest for unit tests, Playwright for end-to-end tests, MSW v2 for API mocking.

## Data Flow

1. **Initialization & Bot Gating**: At the application shell level, Turnstile verification is executed. All subsequent spatial data fetches remain disabled until a valid token is produced (or bypassed in local development).
2. **Server State Fetching**: Core data (routes and stops) is fetched at the top level using TanStack Query hooks, cascading the results downward as props to prevent duplicate network requests across pages.
3. **Geometry Degradation Pipeline**: To protect high-fidelity geospatial data, route geometry is fetched through a dual-mode strategy:
   - Metadata is queried directly from Supabase.
   - Geometry data is proxied through an Edge Function that validates the Turnstile token, invokes a `SECURITY DEFINER` RPC to simplify the geometry (`ST_SimplifyPreserveTopology`), and returns the degraded payload. RLS prevents direct access to the raw geometry table by unprivileged users.
4. **Spatial Computations**: Proximity queries (e.g., finding nearby stops or routes for a given stop) are offloaded to Postgres RPCs, executing PostGIS geographic calculations securely on the server.
5. **Client-Side Routing**: The application reacts to changes in the Routing Store's origin and destination by running a pure client-side algorithm. It cross-joins candidate stops, validates sequence direction, slices geometries, computes Turf-based heuristics (distance/time), and writes the optimal paths back to the store.
6. **URL State Synchronization**: A dedicated hook ensures the Routing Store's coordinates remain bidirectionally synced with the URL query parameters, enabling deep-linking and browser history navigation.
7. **Map Rendering Loop & Caching**: The map components consume state from both the Map Store and TanStack Query cache. Leaflet layers composite map tiles (cached locally via PWA Service Workers) with dynamic route polylines and stop markers, automatically updating based on visibility filters and selection states.
8. **Administrative Mutability**: Dedicated editor views bypass Turnstile gating to provide a freehand drawing canvas. New route coordinates are processed through an RDP simplification pipeline and snapped to road networks via the OSRM Match API before being persisted to the database.
