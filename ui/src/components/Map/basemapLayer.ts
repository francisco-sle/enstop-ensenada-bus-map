import L from 'leaflet'
import { setWorkerUrl } from 'maplibre-gl'
import '@maplibre/maplibre-gl-leaflet'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre v6 ships its worker as a separate ES module; let Vite bundle it
// into a same-origin file (keeps CSP at `worker-src 'self'`).
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { basemap, tintBasemapStyle } from './mapConfig'

setWorkerUrl(workerUrl)

/** Builds the MapLibre-backed Leaflet layer. Loaded lazily by `<Basemap />`. */
export function createBasemapLayer(): L.Layer {
  const layer = L.maplibreGL({
    // Start empty, then load the remote style through `transformStyle`
    // so the brand tint is applied before the first frame is drawn.
    style: { version: 8, sources: {}, layers: [] },
    attributionControl: false,
    maxZoom: basemap.maxZoom,
  })

  layer.once('add', () => {
    layer.getMaplibreMap().setStyle(basemap.styleUrl, {
      transformStyle: (_previous, next) => tintBasemapStyle(next),
    })
  })

  return layer
}
