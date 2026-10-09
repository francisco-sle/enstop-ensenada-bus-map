import { useMemo } from 'react'
import L from 'leaflet'
import { CircleMarker, Pane } from 'react-leaflet'
import { useThemeStore } from '../../store/themeStore'
import { IS_TOUCH } from './stopLayout'
import type { StopMarkerData } from './useBusMapMarkers'

// Above route lines (overlayPane, 400), below icon markers (markerPane, 600).
const STOP_DOTS_PANE = 'stopDots'

/** Dots grow with zoom: pinpricks at city scale, tappable rings near street scale. */
function dotRadius(zoom: number, onSelectedRoute: boolean): number {
  const base = IS_TOUCH
    ? zoom >= 14
      ? 6.5
      : 5.5 // ~16px / ~14px across with the ring, close to the old icon's footprint
    : zoom >= 15
      ? 4.5
      : zoom >= 14
        ? 3.5
        : 3
  return onSelectedRoute ? base + 0.5 : base
}

/** Canvas can't read CSS variables, so theme tokens are resolved up front. */
function resolveColor(color: string, styles: CSSStyleDeclaration): string {
  const name = color.match(/^var\((--[\w-]+)\)$/)?.[1]
  return name ? styles.getPropertyValue(name).trim() || '#2563EB' : color
}

interface StopDotsLayerProps {
  dots: StopMarkerData[]
  zoom: number
  /** A route is highlighted: stops off it fade back */
  hasSelectedRoute: boolean
  onSelect: (stopId: number) => void
}

/**
 * Mid-zoom stops as small canvas circles. One canvas draws thousands of stops
 * at the cost of a few DOM icons, and the ring keeps the look of the icon markers.
 */
export function StopDotsLayer({ dots, zoom, hasSelectedRoute, onSelect }: StopDotsLayerProps) {
  const theme = useThemeStore((s) => s.resolved)

  // Wider hit area on touch screens. Kept within half the touch stop spacing
  // (stopLayout.ts) so a tap on one dot never lands in its neighbor's hit area.
  const renderer = useMemo(
    () => L.canvas({ pane: STOP_DOTS_PANE, padding: 0.5, tolerance: IS_TOUCH ? 4 : 3 }),
    [],
  )

  const palette = useMemo(() => {
    const styles = getComputedStyle(document.documentElement)
    return {
      styles,
      fill: resolveColor('var(--color-paper)', styles),
      muted: resolveColor('var(--color-ink-faint)', styles),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])

  return (
    <Pane name={STOP_DOTS_PANE} style={{ zIndex: 450 }}>
      {dots.map(({ stop, color, onSelectedRoute }) => {
        const [lng, lat] = stop.geom.coordinates
        const stroke =
          hasSelectedRoute && !onSelectedRoute ? palette.muted : resolveColor(color, palette.styles)
        return (
          <CircleMarker
            key={stop.id}
            center={[lat, lng]}
            radius={dotRadius(zoom, onSelectedRoute)}
            renderer={renderer}
            bubblingMouseEvents={false}
            pathOptions={{
              color: stroke,
              weight: onSelectedRoute ? 2.5 : 2,
              fillColor: palette.fill,
              fillOpacity: 1,
            }}
            eventHandlers={{ click: () => onSelect(stop.id) }}
          />
        )
      })}
    </Pane>
  )
}
