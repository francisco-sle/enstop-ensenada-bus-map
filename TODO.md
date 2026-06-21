# TODO — Environment Variables for Anti-Scraping Phase

These variables must be configured before deploying the route-proxy Edge Function
to production. Local development works without them (the app auto-bypasses the
Turnstile gate when `VITE_TURNSTILE_SITE_KEY` is absent).

---

## Frontend variable (goes in `ui/.env.local`)

### `VITE_TURNSTILE_SITE_KEY`

The **public** site key for Cloudflare Turnstile. Safe to expose in client-side code.

**How to get it:**
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Turnstile** (left sidebar).
2. Click **Add Site**.
3. Enter a site name (e.g. `enstop-production`) and your domain.
4. Choose widget type — **Managed** (recommended) or **Invisible**.
5. Copy the **Site Key** shown after creation.
6. Paste it into `ui/.env.local`:
   ```
   VITE_TURNSTILE_SITE_KEY=<your site key here>
   ```

---

## Edge Function secrets (set via Supabase CLI — never in `.env` files)

These are server-side secrets injected into the Deno runtime at deploy time.
They are **not** Vite variables and must never be committed to the repo.

### `TURNSTILE_SECRET`

The **secret key** for Cloudflare Turnstile. Used by the Edge Function to verify
challenge tokens server-side.

**How to get it:**
1. Same Turnstile dashboard page as above.
2. After creating the site, copy the **Secret Key** (different from the Site Key).
3. Set it on your Supabase project:
   ```sh
   supabase secrets set TURNSTILE_SECRET=<your secret key>
   ```

### `SUPABASE_SERVICE_ROLE_KEY`

The service role JWT that lets the Edge Function bypass RLS and call
`get_degraded_routes()` directly.

**How to get it:**
1. Go to [Supabase Dashboard](https://app.supabase.com/) → your project → **Settings** → **API**.
2. Under **Project API keys**, copy the **service_role** key (marked "secret").
3. Set it:
   ```sh
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your service role key>
   ```

> **Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are also auto-injected
> by Supabase when the function is deployed via `supabase functions deploy route-proxy`,
> so you may not need to set `SUPABASE_SERVICE_ROLE_KEY` manually in hosted environments.

---

## Deploy checklist

- [ ] Cloudflare Turnstile site created for production domain
- [ ] `VITE_TURNSTILE_SITE_KEY` added to `ui/.env.local` (and to your CI/CD environment)
- [ ] `TURNSTILE_SECRET` set via `supabase secrets set`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set via `supabase secrets set` (if not auto-injected)
- [ ] Edge Function deployed: `supabase functions deploy route-proxy`
- [ ] RLS migration `20260619200000_spatial_degradation.sql` applied to production DB

---

## Future Enhancements

- [ ] **Convert to Progressive Web App (PWA):** See [pwa-considerations.md](file:///home/francisco/repos/enstop/plans/pwa-considerations.md) for implementation details (offline map tiles, route caching, and installability).
