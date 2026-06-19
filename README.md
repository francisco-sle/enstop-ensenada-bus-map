# ENStop — Ensenada Bus Map 🚌

> An interactive, real-time transit map for the city of Ensenada, Baja California. ENStop lets riders explore bus routes, plan origin-to-destination trips, view stop details, and look up current fares — all from a fast, map-first interface.

---

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Local Development Setup](#local-development-setup)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

---

## Project Description

ENStop is a full-stack geospatial web application that models Ensenada's public bus network as structured data. The core features include:

- **Interactive map** — OSM base tiles with color-coded route polylines and stop markers.
- **Route planner** — Origin/destination trip planning with a client-side routing algorithm (stop cross-join → sequence validation → geometry slicing → Turf distance scoring). Deep-links via `?from=lat,lng&to=lat,lng` URL params.
- **Stop details** — Slide-up drawer listing all routes serving a selected stop.
- **Fare lookup** — Live fare table per route, filtered by passenger type.
- **Editor (`/studio`)** — Admin canvas for drawing and persisting new bus routes with OSRM road-snapping and RDP simplification.
- **Offline/CI mode** — MSW mock layer activated by `VITE_USE_MOCKS=true`.

The monorepo is split into two layers:

| Layer | Path | Purpose |
|---|---|---|
| **Frontend** | `ui/` | React SPA (Vite + TypeScript) |
| **Backend** | `supabase/` | Postgres 15 + PostGIS schema, RLS policies, spatial RPC functions |

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
| Testing | Vitest (unit) + Playwright (e2e) |
| Mocking | MSW v2 |

### Backend (`supabase/`)

| Category | Technology |
|---|---|
| Database | Postgres 15 + PostGIS |
| Backend-as-a-Service | Supabase (Auth, RLS, RPC) |
| Client | `@supabase/supabase-js` v2 |
| Migrations | 3 ordered SQL files: `initial_schema` → `rls_policies` → `spatial_functions` |

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

Copy the example environment file and fill in your Supabase credentials:

```bash
cp ui/.env.example ui/.env.local
```

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key |

### 4. Start the local Supabase stack

```bash
npm run db:start
```

This spins up a local Postgres + PostGIS instance via Docker, runs all migrations, and seeds Ensenada route/stop data from `supabase/seed.sql`.

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
| `npm run dev` | Start Vite dev server against local Supabase |
| `npm run dev:mock` | Start Vite dev server with MSW offline mocks |
| `npm run build` | Type-check + production build → `dist/` |
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

---

## Editor Setup (VS Code)

This repository ships a `.vscode/` directory with recommended extensions and workspace settings. When you open the project, VS Code will prompt you to install the recommended extensions.

### Recommended Extensions

| Extension | Purpose |
|---|---|
| [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) (`dbaeumer.vscode-eslint`) | Inline lint errors and warnings |
| [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) (`esbenp.prettier-vscode`) | Format-on-save |
| [TypeScript Nightly](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next) (`ms-vscode.vscode-typescript-next`) | Latest TS language features |
| [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) (`bradlc.vscode-tailwindcss`) | Class autocomplete + `@theme` token hints |
| [ES7 React Snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets) (`dsznajder.es7-react-js-snippets`) | React component boilerplate shortcuts |
| [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) (`eamodio.gitlens`) | Inline blame and history |
| [Vitest](https://marketplace.visualstudio.com/items?itemName=vitest.explorer) (`vitest.explorer`) | Run/debug unit tests from the sidebar |
| [Playwright](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) (`ms-playwright.playwright`) | Run/debug e2e tests from the sidebar |

### Workspace Behavior

The `.vscode/settings.json` configures the following automatically:

- **Format on save** — Prettier runs on every save.
- **ESLint fix on save** — Auto-fixable ESLint violations are corrected on save (`source.fixAll.eslint`).
- **Workspace TypeScript SDK** — Uses the local `typescript` version from `ui/node_modules` for accurate type checking.
- **Tailwind IntelliSense** — Points at `ui/src/styles/index.css` so `@theme` tokens resolve in class autocomplete.

> If VS Code doesn't prompt for extensions automatically, open the **Command Palette** (`Ctrl+Shift+P`) and run **Extensions: Show Recommended Extensions**.

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

### Resetting a broken local database

If migrations or seed data are in a bad state:

```bash
npm run db:reset
```

This drops and recreates the local database, re-runs all migrations, and re-seeds the data.
