# ADR 001: Protecting Route Geometries vs. Server-Side Rendering (SSR)

**Date**: 2026-06-20  
**Status**: Accepted  

## Context

The most valuable data asset in the Enstop project is the high-fidelity GPS coordinate traces of the Ensenada bus routes. A core requirement is to protect this data from being easily scraped or stolen by automated bots, while still allowing the web application to draw the routes on an interactive map.

A common misconception is that migrating the Single Page Application (Vite/React) to a Server-Side Rendering (SSR) framework (like Next.js or Remix) would inherently protect this data by hiding the API calls on the server.

However, an interactive map (e.g., Leaflet, Mapbox) relies on **vector rendering** in the browser. Even if the initial HTML is generated on the server, the raw geometric coordinates must still be serialized and sent to the client (often embedded in the HTML as hydration props like `__NEXT_DATA__`) so the map library can draw the interactive polylines, handle zooming, and trigger hover events. 

Therefore, SSR provides **zero protection** against scraping vector geometries. A scraper could simply download the SSR-generated HTML document, parse the embedded JSON payload, and extract the high-fidelity coordinates in seconds. 

The only way a server could completely hide the coordinates is by rendering the map into static raster images (PNG tiles) on the server (e.g., using Mapnik). However, this would destroy map interactivity, cost massive amounts of server compute, and add severe latency, making it an unsuitable overkill for this application.

## Decision

We will **not** use SSR as a security mechanism. Instead, we have implemented the industry-standard pattern for protecting proprietary spatial data in a Single Page Application: **Spatial Degradation via an Edge Proxy**.

The architecture consists of three layers:

1. **Column-Level Restriction**: We use Supabase column-level grants to completely deny `SELECT` access to the `geom` column for the `anon` and `authenticated` roles. The public API can only read route metadata.
2. **Spatial Degradation**: We utilize a backend PostGIS RPC (`get_degraded_routes`) using `ST_SimplifyPreserveTopology(geom, 0.0005)`. This mathematically degrades the paths, returning just enough points to draw a decent line on the screen, ensuring the true, meter-accurate data never leaves the database.
3. **Edge Proxy**: We gate the degraded RPC behind a Deno Edge Function (`route-proxy`) integrated with Cloudflare Turnstile. This ensures that even the degraded data cannot be rapidly scraped by automated headless bots.

## Consequences

**Positive:**
- **Robust Security**: The high-fidelity vectors are mathematically protected at the database level.
- **Bot Mitigation**: Turnstile prevents automated mass-scraping of even the degraded data.
- **Cost-Effective Hosting**: The frontend remains a static Vite SPA, which can be hosted for pennies on edge networks (Vercel, Cloudflare Pages), avoiding the expensive compute required for a Node-based SSR server.
- **Interactivity Maintained**: The client still receives vector data (GeoJSON) allowing for full, smooth interactive maps.

**Negative:**
- **Data Fetching Complexity**: Requires splitting route data fetching into two parallel requests on the client: one for metadata (direct Supabase REST) and one for geometry (Edge Function Proxy).
- **Local Development**: Requires mocking or bypassing the Turnstile proxy during local development.
