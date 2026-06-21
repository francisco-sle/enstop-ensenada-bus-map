# Environment Variables & Deployment Strategy

This document outlines how environment variables are handled in the local development workflow and the Cloudflare production deployment.

## The Core Concept: Vite Modes
Vite determines which `.env` file to load based entirely on the `--mode` flag passed in the execution command. Vite only ever loads ONE specific environment file at a time (along with the `.env.local` override).

- If no mode is passed, `npm run dev` defaults to **development** mode.
- If no mode is passed, `npm run build` defaults to **production** mode.

**The `.env.local` Override Rule:**
Vite has one special rule: **`.env.local` is the ultimate trump card**. No matter what mode you are running, Vite will *always* load `.env.local` last, and any variables inside it will overwrite conflicting variables from other files. `.env.local` is git-ignored and reserved exclusively for your personal local credentials.

---

## Local Development Workflow

You do not need to manually swap or rename `.env` files. The `package.json` scripts dictate which backend the app connects to.

### 1. Local Supabase CLI
> **Command:** `npm run dev`
- **Mode:** `development` (Vite's default)
- **File Loaded:** `.env.local`
- **Result:** Connects to `http://localhost:54321`. Mocks are disabled (`VITE_USE_MOCKS=false`). Use this when actively developing full-stack features with the Supabase CLI.

### 2. Mock Backend (MSW)
> **Command:** `npm run dev:mock`
- **Mode:** `mock` (`vite --mode mock`)
- **File Loaded:** `ui/.env.mock`
- **Result:** `VITE_USE_MOCKS=true` is injected. MSW (Mock Service Worker) intercepts all API requests in the browser. The frontend works completely standalone without needing the Supabase CLI running.

### 3. External Dev Database
> **Command:** `npm run dev:external`
- **Mode:** `dev` (`vite --mode dev`)
- **File Loaded:** `ui/.env.dev`
- **Result:** Connects to a remote, non-production Supabase instance (e.g., `https://your-dev-project.supabase.co`). Mocks are disabled.

---

## Production Deployment (Cloudflare Pages)

The production deployment strategy relies on Cloudflare's native environment variable injection to prevent hardcoded secrets from entering the Git repository.

> **Command:** `npm run build` (Executed automatically by Cloudflare)
- **Mode:** `production` (Vite's default)
- **File Loaded:** None from Git (because `.env.production` is git-ignored for security).
- **Result:** Vite pulls environment variables directly from the Cloudflare Pages Dashboard settings.

### Managing Cloudflare Variables
Since `.env.production` is untracked to prevent secret leaks, you must define production configurations directly in the Cloudflare Dashboard:

1. Go to **Cloudflare Dashboard** → **Pages** → **enstop-ensenada-bus-map**
2. Go to **Settings** → **Environment variables**
3. Under **Production**, click **Add variable**

**Current Production State:**
While the backend is still under development, the Cloudflare deployment relies on MSW to serve the application.
- `VITE_USE_MOCKS` = `true` (Set in Cloudflare Dashboard)

**Future Production State:**
When the backend is live and ready for production traffic, update the Cloudflare variables:
- `VITE_USE_MOCKS` = `false`
- `VITE_SUPABASE_URL` = `https://your-production.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `your-production-anon-key`
