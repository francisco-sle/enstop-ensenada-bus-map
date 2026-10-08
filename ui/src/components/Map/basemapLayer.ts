import L from 'leaflet'
import { setWorkerUrl } from 'maplibre-gl'
import '@maplibre/maplibre-gl-leaflet'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre v6 ships its worker as a separate ES module; let Vite bundle it
// into a same-origin file (keeps CSP at `worker-src 'self'`).
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { basemap, tintBasemapStyle } from './mapConfig'
import type { ResolvedTheme } from '../../store/themeStore'

setWorkerUrl(workerUrl)

/** Builds the MapLibre-backed Leaflet layer. Loaded lazily by `<Basemap />`. */
export function createBasemapLayer(theme: ResolvedTheme): L.MaplibreGL {
  const layer = L.maplibreGL({
    // Start empty, then load the remote style through `transformStyle`
    // so the brand tint is applied before the first frame is drawn.
    style: { version: 8, sources: {}, layers: [] },
    attributionControl: false,
    maxZoom: basemap.maxZoom,
  })

  layer.once('add', () => applyBasemapTheme(layer, theme))

  return layer
}

/**
 * Re-tints a live basemap for the given theme. MapLibre diffs the new style
 * against the current one, so only paint properties change — tiles stay loaded.
 */
export function applyBasemapTheme(layer: L.MaplibreGL, theme: ResolvedTheme) {
  layer.getMaplibreMap().setStyle(basemap.styleUrl, {
    transformStyle: (_previous, next) => tintBasemapStyle(next, theme),
  })
}
