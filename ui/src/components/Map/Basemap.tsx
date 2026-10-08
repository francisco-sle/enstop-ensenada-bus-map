import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import type L from 'leaflet'
import { basemap } from './mapConfig'
import { useThemeStore } from '../../store/themeStore'

/**
 * Vector basemap layer. Drop inside a react-leaflet `MapContainer` in place of
 * a `TileLayer`; the MapLibre canvas is non-interactive, so Leaflet keeps
 * handling every pointer event.
 *
 * MapLibre is code-split: the UI and markers render immediately while the
 * renderer chunk streams in. The basemap palette follows the light/dark theme.
 */
export function Basemap() {
  const map = useMap()
  const theme = useThemeStore((s) => s.resolved)
  const layerRef = useRef<L.MaplibreGL | null>(null)

  useEffect(() => {
    let cancelled = false

    import('./basemapLayer').then(({ createBasemapLayer }) => {
      if (cancelled) return
      // Read the theme at load time so a toggle during the chunk download still applies.
      layerRef.current = createBasemapLayer(useThemeStore.getState().resolved).addTo(map)
    })
    map.attributionControl?.addAttribution(basemap.attribution)

    return () => {
      cancelled = true
      map.attributionControl?.removeAttribution(basemap.attribution)
      if (layerRef.current) map.removeLayer(layerRef.current)
      layerRef.current = null
    }
  }, [map])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    import('./basemapLayer').then(({ applyBasemapTheme }) => applyBasemapTheme(layer, theme))
  }, [theme])

  return null
}
