# Project Status & TODOs

## ✅ Achieved: Data Privacy & Architecture

1. **Spatial Degradation (Proprietary Data Protection)**
   - Locked down the `routes` table via PostgREST Row Level Security (RLS).
   - Implemented the `get_degraded_routes()` Postgres function using `ST_SnapToGrid` and `ST_SimplifyPreserveTopology`. This completely scrubs the proprietary high-precision float coordinates while tightly hugging the street grid (even on small roundabouts).
   - Deployed the `route-proxy` Edge Function to securely bypass RLS and serve the scrubbed data.
2. **Bot Mitigation**
   - Cloudflare Turnstile integrated into the frontend map view.
   - The `route-proxy` Edge Function strictly validates Turnstile tokens before returning route geometries.
3. **Mock & Deployment Architecture**
   - The frontend is fully decoupled from the backend during development and mock deployments.
   - Vite is configured to compile with `--mode mock` to seamlessly bundle the Mock Service Worker (MSW).
   - Centralized `supabase.ts` configuration guarantees that mock builds never leak requests to the production database (preventing 401/405 errors on Cloudflare).

## 🛑 Deprecated / Abandoned

- **OSRM Public Demo Server Usage:** We have abandoned the feature for calculating high-fidelity walking routes with snapping capabilities. Relying on the public OSRM server was unreliable, and switching to a production-ready routing API would introduce unnecessary costs. The project focus remains on direct bus route visualization.

---

## 🚀 To-Do: Production Deployment (Backend)

The frontend is currently deployed on Cloudflare Pages using mock data. To switch the frontend to production data, the following backend tasks must be completed:

### 1. Configure Cloudflare Turnstile
- [ ] Create a site in the [Cloudflare Dashboard](https://dash.cloudflare.com/) (Managed or Invisible widget).
- [ ] Add `VITE_TURNSTILE_SITE_KEY` to the Cloudflare Pages environment variables.
- [ ] Add `TURNSTILE_SECRET` to the Supabase project:
  ```sh
  supabase secrets set TURNSTILE_SECRET=<your secret key>
  ```

### 2. Deploy Supabase Backend
- [ ] Link the local project to the production Supabase project: `supabase link --project-ref <your-project-id>`
- [ ] Push the database schema, spatial functions, and RLS policies:
  ```sh
  supabase db push
  ```
- [ ] Ensure the service role key is set for the Edge Function (if not auto-injected):
  ```sh
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your service role key>
  ```
- [ ] Deploy the route-proxy Edge Function:
  ```sh
  supabase functions deploy route-proxy
  ```

### 3. Seed Proprietary Data
- [ ] Replace the mock route data with the actual proprietary GPS data.
- [ ] Upload the real data to the production Supabase database.

---

## 🔮 Future Enhancements

- [ ] **Convert to Progressive Web App (PWA):** See [plans/pwa-considerations.md](file:///home/francisco/repos/enstop/plans/pwa-considerations.md) for implementation details (offline map tiles, route caching, and installability).
