# `src/pages` — Route-Level Page Components

Each file corresponds directly to a React Router `<Route>`. Pages are thin orchestrators — they compose components and connect stores, but contain minimal local UI logic.

## Files

| File | Route | Responsibility |
|---|---|---|
| `MapPage.tsx` | `/map` | Full-screen map view. Owns URL↔Store sync for origin/destination via `useUrlStoreSync`. Renders `BusMap`, `RoutePlanner`, `RouteResult`, and `StopDrawer`. |
| `RoutesPage.tsx` | `/routes` | List of all available transit routes. |
| `RouteDetailPage.tsx` | `/routes/:id` | Detail view for a single route: map preview, stop sequence, fare table. Hardcoded `dummyFares` pending real `useCurrentFare` integration. |
| `AboutPage.tsx` | `/about` | Static informational page. |

## Rules
- Pages receive pre-fetched data as props from `App.tsx` (where `useRoutes`/`useStops` live).
- Pages must not make their own data-fetching calls; delegate to `src/api` hooks.
- All cross-page navigation must use `useNavigate` or `<NavLink>` from `react-router-dom`.
