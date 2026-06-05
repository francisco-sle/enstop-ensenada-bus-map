# `src/components` — Shared UI Components

Components are grouped by domain. Each subdirectory owns all UI elements for that feature area.

## Directories

| Directory | Responsibility |
|---|---|
| `Map/` | Leaflet-based map canvas. `BusMap` is the root component; sub-components (`MapController`, `MapEventsHandler`, `MapContextMenu`) are Leaflet-internal helpers and must not be used outside the `Map/` directory. |
| `Routing/` | A→B trip-planning UI. `RoutePlanner` is the form entry point. `RouteResult` displays computed routing suggestions. `routing.ts` contains pure routing heuristics (no React). |
| `StopDetail/` | Slide-up drawer for a selected stop's details and route list. |
| `RouteDetail/` | Components for the route detail page (fare table, stop sequence). |

## Composition Rules
- Map components must not import from `Routing/` and vice versa. Cross-feature communication is done through `src/store`.
- `BusMap` accepts `activeRoutes` and `allStops` as props — it never fetches data itself.
- `RoutePlanner` uses `LocationAutocomplete` for both origin and destination fields; do not duplicate field logic inline.
