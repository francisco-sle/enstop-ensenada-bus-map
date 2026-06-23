<div align="center">

# ENStop — Ensenada Bus Map 🚌

[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)

**An interactive, real-time transit map for the city of Ensenada, Baja California.**

[Explore Features](#why-enstop) • [Architecture](#architecture-overview) • [Contributing](#contributing)

</div>

## Why ENStop?

ENStop is a full-stack geospatial progressive web application (PWA) that models Ensenada's public bus network as structured data.

- **Fast & Interactive Map** — OSM base tiles with color-coded route polylines and stop markers.
- **Client-Side Route Planner** — Origin/destination trip planning with a powerful in-browser routing algorithm. Deep-links via `?from=lat,lng&to=lat,lng` URL params with fully isolated state across pages.
- **Offline & PWA Ready** — Uses Workbox for robust runtime caching of map basemap tiles and static assets. Always available, even with poor connectivity.
- **Studio Editor (`/studio`)** — Admin canvas for drawing and persisting new bus routes with OSRM road-snapping, RDP simplification, and **autosave functionality**.
- **Comprehensive Details** — Slide-up drawer listing all routes serving a selected stop, plus live fare tables filtered by passenger type.
- **Data-Decoupled Security** — Route geometry flows through a Cloudflare Turnstile-gated Supabase Edge Function that runs PostGIS topology simplification to prevent data scraping.

> [!TIP]
> ENStop is continuously improving! Recent updates include Studio Autosave, strict route state isolation between views, new PWA caching strategies, and comprehensive legal pages.

---

## Table of Contents

- [Why ENStop?](#why-enstop)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Editor Setup](#editor-setup-vs-code)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The monorepo is split into two layers:

| Layer | Path | Purpose |
|---|---|---|
| **Frontend** | `ui/` | React SPA (Vite + TypeScript) |
| **Backend** | `supabase/` | Postgres 15 + PostGIS schema, RLS policies, spatial RPCs, Edge Functions |

### Data-Decoupled Design

Route geometry is **never exposed directly to the client**. The `routes` table has no public SELECT policy; all geometry reads flow through a Deno Edge Function proxy:

```
Browser
  └─► route-proxy (Edge Function)
        ├─ Cloudflare Turnstile validation
        ├─ In-memory rate limiting (30 req/min per IP)
        └─► get_degraded_routes() RPC  ← ST_SimplifyPreserveTopology(0.0005)
              └─► routes table (service_role only)
```

Non-geometric metadata (route names, colors, stops, fares) continues to be fetched directly from Supabase under standard RLS.

**Local development bypass:** When `VITE_TURNSTILE_SITE_KEY` is absent, the app detects this and queries Supabase directly with a full join, restoring the original dev-mode behavior. No Edge Function is required to run locally.

### Database Migrations

Four ordered SQL migrations define the full database surface:

| File | Purpose |
|---|---|
| `001_initial_schema.sql` | Tables: `categories`, `routes`, `stops`, `route_stops`, `fare_rules` |
| `002_rls_policies.sql` | Row-Level Security — `routes` table is SELECT-locked; all others are public-readable |
| `003_spatial_functions.sql` | PostGIS RPCs: `nearby_stops`, `routes_for_stop` |
| `20260619200000_spatial_degradation.sql` | `get_degraded_routes()` — returns topology-simplified geometry; EXECUTE granted to `service_role` only |

### Seed Files

| File | Status | Purpose |
|---|---|---|
| `supabase/seed.sql` | **Committed** | Minimal 2-stop mock route for CI/CD |
| `supabase/seed.private.sql` | **Git-ignored** | High-fidelity production coordinates |

### Edge Functions

| Function | Path | Purpose |
|---|---|---|
| `route-proxy` | `supabase/functions/route-proxy/index.ts` | Turnstile-gated, rate-limited geometry proxy |

---

## Tech Stack

### Frontend (`ui/`)

| Category | Technology |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4.x (CSS-first, `@theme` tokens in `ui/src/styles/index.css`) |
| Map Rendering | Leaflet 1.9 + react-leaflet 5 + `leaflet-polylinedecorator` |
| Spatial Utils | `@turf/turf` |
| Server State | TanStack React Query v5 |
| Client State | Zustand v5 (`useMapStore`, `useRoutingStore`) |
| Routing | React Router DOM v6 |
| Icons | lucide-react |
| Geocoding | Photon API |
| Road Snapping | OSRM public API |
| Bot Protection | Cloudflare Turnstile (`@marsidev/react-turnstile`) |
| Testing | Vitest (unit) + Playwright (e2e) |
| Mocking | MSW v2 |

### Backend (`supabase/`)

| Category | Technology |
|---|---|
| Database | Postgres 15 + PostGIS |
| Backend-as-a-Service | Supabase (Auth, RLS, RPC, Edge Functions) |
| Edge Runtime | Deno (`supabase/functions/`) |
| Client | `@supabase/supabase-js` v2 |
| Migrations | 4 ordered SQL files (see Architecture Overview) |

---

## Local Development Setup

### Prerequisites

Make sure the following are installed globally:

- [Node.js](https://nodejs.org/) (v20+)
- [npm](https://www.npmjs.com/) (v10+)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)
- [Docker](https://www.docker.com/) (required by the Supabase local stack)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/enstop.git
cd enstop
```

### 2. Install dependencies

```bash
npm install
```

This installs all workspace dependencies, including those in `ui/`.

### 3. Configure environment variables

```bash
cp ui/.env.local.example ui/.env.local
```

Fill in your Supabase credentials. The new `VITE_TURNSTILE_SITE_KEY` field can be left blank for local development — the app bypasses the challenge gate automatically when the key is absent. See [Environment Variables](#environment-variables) for full details.

### 4. Start the local Supabase stack

```bash
npm run db:start
```

This spins up a local Postgres + PostGIS instance via Docker, runs all migrations, and seeds mock route/stop data from `supabase/seed.sql`.

> **Note:** The committed `seed.sql` contains a minimal 2-stop mock route (safe for CI/CD). Real Ensenada coordinates are stored in the git-ignored `supabase/seed.private.sql`. Copy your high-fidelity data there after cloning.

### 5. Generate TypeScript types from the database schema

```bash
npm run db:types
```

This writes the generated types to `ui/src/types/supabase-generated.ts`. Re-run this whenever migrations change.

### 6. Start the development server

**With live Supabase backend:**

```bash
npm run dev
```

**With MSW mock layer (no Supabase required):**

```bash
npm run dev:mock
```

The app is served at `http://localhost:5173` by default.

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server against local Supabase (`.env.local`) |
| `npm run dev:mock` | Start Vite dev server with MSW offline mocks (`.env.mock`) |
| `npm run dev:external` | Start Vite dev server against a remote dev database (`.env.dev`) |
| `npm run build` | Type-check + production build → `dist/` (uses Cloudflare Build Variables) |
| `npm run test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint and auto-fix violations |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check formatting without writing changes |
| `npm run typecheck` | Run `tsc --noEmit` type check |
| `npm run db:start` | Start local Supabase stack |
| `npm run db:stop` | Stop local Supabase stack |
| `npm run db:reset` | Reset DB and re-run migrations + seed |
| `npm run db:diff` | Diff local schema against remote |
| `npm run db:push` | Push migrations to remote Supabase project |
| `npm run db:studio` | Open Supabase Studio UI |

---

## Environment Variables

### Frontend

The frontend uses Vite's native mode system to load environment variables. **`.env.local` is the ultimate override** — it is git-ignored and reserved for your personal credentials.

| Environment | Command | File Loaded | Purpose |
|---|---|---|---|
| **Local Development** | `npm run dev` | `.env.local` | Develop against the local Supabase CLI instance (`http://localhost:54321`). Mocks are disabled by default. |
| **Mock Development** | `npm run dev:mock` | `.env.mock` | Forces `VITE_USE_MOCKS=true`. MSW intercepts all requests so no Supabase backend is needed. |
| **External Dev** | `npm run dev:external` | `.env.dev` | Connect to a remote, non-production Supabase instance. |

#### Required Variables (in `.env.local` or `.env.dev`)
| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ Always | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Always | Supabase anon public key |
| `VITE_USE_MOCKS` | ✅ Always | `true` or `false` to enable/disable MSW layer |
| `VITE_TURNSTILE_SITE_KEY` | Production | Cloudflare Turnstile site key. **Leave blank for local dev**. |

### Production Deployment (Cloudflare Pages)

We do **not** commit a `.env.production` file for security reasons. Instead, production variables must be injected during the build step via the Cloudflare Dashboard:

1. Go to **Cloudflare Dashboard → Pages → enstop-ensenada-bus-map**.
2. Navigate to **Settings → Environment variables**.
3. Under the **Production** section (specifically the **Build variables**), add your variables.

*Note: While the backend is in active development, set `VITE_USE_MOCKS=true` in Cloudflare so the production deployment can safely serve mock data.*

### Edge Function secrets (set via Supabase CLI)

These are server-side secrets injected into the Deno runtime. They are **not** Vite variables and must never be committed.

| Secret | Description | How to set |
|---|---|---|
| `TURNSTILE_SECRET` | Cloudflare Turnstile secret key | `supabase secrets set TURNSTILE_SECRET=...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role JWT (auto-injected on deploy) | `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...` |

See [`TODO.md`](./TODO.md) for step-by-step instructions on obtaining these values from the Cloudflare and Supabase dashboards, plus a production deploy checklist.

---

## Editor Setup (VS Code)

This repository ships a `.vscode/` directory with recommended extensions and workspace settings. When you open the project, VS Code will prompt you to install the recommended extensions.

### Recommended Extensions

| Extension | Purpose |
|---|---|
| [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | Inline lint errors and warnings |
| [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) | Format-on-save |
| [TypeScript Nightly](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next) | Latest TS language features |
| [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) | Class autocomplete + `@theme` token hints |
| [Deno](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno) | Deno runtime types for `supabase/functions/` |
| [Vitest](https://marketplace.visualstudio.com/items?itemName=vitest.explorer) | Run/debug unit tests from the sidebar |
| [Playwright](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) | Run/debug e2e tests from the sidebar |

### Workspace Behavior

The `.vscode/settings.json` configures the following automatically:

- **Format on save** — Prettier runs on every save.
- **ESLint fix on save** — Auto-fixable ESLint violations are corrected on save.
- **Workspace TypeScript SDK** — Uses the local `typescript` version from `ui/node_modules`.
- **Tailwind IntelliSense** — Points at `ui/src/styles/index.css` so `@theme` tokens resolve in class autocomplete.
- **Deno** — The `supabase/functions/` directory uses a scoped `deno.json` so the Deno language server activates only there, avoiding conflicts with the Vite TypeScript project.

> If VS Code doesn't prompt for extensions automatically, open the Command Palette (`Ctrl+Shift+P`) and run **Extensions: Show Recommended Extensions**.

---

## Contributing

Contributions are welcome! Please follow these steps:

### 1. Fork & branch

```bash
git checkout -b feat/your-feature-name
```

Use a clear prefix: `feat/`, `fix/`, `chore/`, `docs/`.

### 2. Understand the architecture

Read [`architecture.md`](./architecture.md) before writing any code. It is the source of truth for folder boundaries, data-flow rules, and established patterns.

### 3. Follow project conventions

- **No `tailwind.config.js`** — all design tokens live in `ui/src/styles/index.css` under `@theme`.
- **No dynamic Tailwind class interpolation** — all class strings must be fully static literals.
- **State management** — use the existing Zustand stores (`useMapStore`, `useRoutingStore`). Do not create new global state without discussion.
- **API hooks** — add new Supabase queries as TanStack Query hooks in `ui/src/api/`, one file per entity.
- **Route geometry** — never query the `routes` table geometry columns directly from the frontend. All geometry must flow through `route-proxy`.
- **No ad-hoc patches** — trace bugs to root cause before touching code. Refactor over band-aid fixes.

### 4. Test your changes

```bash
npm run typecheck   # zero TypeScript errors required
npm run lint        # zero lint errors required
npm run test        # all unit tests must pass
```

### 5. Open a Pull Request

- Write a clear PR description explaining _what_ changed and _why_.
- Reference any related issues.
- Keep PRs focused — one concern per PR.

---

## Troubleshooting

### Docker is not running

The local Supabase stack requires Docker. Make sure Docker Desktop (or the Docker daemon) is running before calling `npm run db:start`.

---

### `supabase` command not found

Install the Supabase CLI globally:

```bash
npm install -g supabase
```

Or use `npx supabase` as a prefix instead.

---

### Port 5173 already in use

Kill the process occupying the port:

```bash
lsof -ti:5173 | xargs kill -9
```

Then re-run `npm run dev`.

---

### Supabase types are out of sync

If you see TypeScript errors referencing database columns that don't exist (or missing columns), regenerate the types:

```bash
npm run db:types
```

Make sure the local Supabase stack is running first (`npm run db:start`).

---

### Map tiles not loading

ENStop uses OpenStreetMap tiles served directly from OSM CDN. If tiles fail to load, check your network connection. No API key is required for OSM tiles, but rate limits may apply in production — consider a self-hosted tile server or a CDN proxy for deployment.

---

### `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` missing

If the app loads but shows no routes or stops, your environment variables are likely missing or misconfigured. Verify `ui/.env.local` exists and contains valid credentials. For offline development, use `npm run dev:mock` instead.

---

### Map loads but routes have no geometry

In production, route geometry is served via the `route-proxy` Edge Function. If routes appear as empty lines:

1. Confirm `VITE_TURNSTILE_SITE_KEY` is set in your environment.
2. Confirm the Edge Function secrets are configured (`TURNSTILE_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`).
3. Check the Edge Function logs: **Supabase Dashboard → Edge Functions → route-proxy → Logs**.

---

### Resetting a broken local database

If migrations or seed data are in a bad state:

```bash
npm run db:reset
```

This drops and recreates the local database, re-runs all migrations, and re-seeds the data. Remember to repopulate `supabase/seed.private.sql` afterward if needed.
