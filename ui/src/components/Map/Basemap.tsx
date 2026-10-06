import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type L from 'leaflet'
import { basemap } from './mapConfig'

/**
 * Vector basemap layer. Drop inside a react-leaflet `MapContainer` in place of
 * a `TileLayer`; the MapLibre canvas is non-interactive, so Leaflet keeps
 * handling every pointer event.
 *
 * MapLibre is code-split: the UI and markers render immediately while the
 * renderer chunk streams in.
 */
export function Basemap() {
  const map = useMap()

  useEffect(() => {
    let layer: L.Layer | null = null
    let cancelled = false

    import('./basemapLayer').then(({ createBasemapLayer }) => {
      if (cancelled) return
      layer = createBasemapLayer().addTo(map)
    })
    map.attributionControl?.addAttribution(basemap.attribution)

    return () => {
      cancelled = true
      map.attributionControl?.removeAttribution(basemap.attribution)
      if (layer) map.removeLayer(layer)
    }
  }, [map])

  return null
}
