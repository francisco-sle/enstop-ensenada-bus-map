import L from 'leaflet'
import { renderToString } from 'react-dom/server'
import { BusFront, Flag, Footprints } from 'lucide-react'
import { sanitizeColor } from './colorUtils'
import { IS_TOUCH } from './stopLayout'

// ─── Icon Generation Helpers ─────────────────────────────────────────────────

// divIcons are cached per visual variant. Returning the same instance lets
// react-leaflet skip `setIcon`, so markers don't rebuild (and re-animate)
// on every zoom-driven re-render.
const stopIconCache = new Map<string, L.DivIcon>()

export function createStopIcon(colorHex: string, isSelected: boolean) {
  const safeColor = sanitizeColor(colorHex)
  const key = `${safeColor}|${isSelected}`
  const cached = stopIconCache.get(key)
  if (cached) return cached

  const icon = isSelected ? createSelectedStopIcon(safeColor) : createIdleStopIcon(safeColor)
  stopIconCache.set(key, icon)
  return icon
}

// On touch screens the icon is drawn larger and sits in a transparent 44px
// tap area — the minimum comfortable touch target (Apple HIG / Material).
const TOUCH_TAP_SIZE = 44

function createIdleStopIcon(color: string) {
  const size = IS_TOUCH ? 32 : 26
  const box = IS_TOUCH ? TOUCH_TAP_SIZE : size
  const html = renderToString(
    <div
      style={{
        width: box,
        height: box,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="stop-marker"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 0 2px ${color}, 0 3px 8px rgba(30, 41, 59, 0.22)`,
          transformOrigin: '50% 50%',
        }}
      >
        <BusFront size={IS_TOUCH ? 17 : 14} color={color} strokeWidth={2.4} />
      </div>
    </div>,
  )

  return L.divIcon({
    className: 'custom-stop-marker',
    html,
    iconSize: [box, box],
    iconAnchor: [box / 2, box / 2],
  })
}

function createSelectedStopIcon(color: string) {
  const head = 40
  const tail = 8
  const html = renderToString(
    <div
      className="stop-marker"
      style={{
        width: head,
        height: head + tail,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        filter: 'drop-shadow(0 6px 10px rgba(30, 41, 59, 0.3))',
      }}
    >
      <div
        style={{
          width: head,
          height: head,
          borderRadius: '50%',
          background: color,
          border: '3px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BusFront size={19} color="white" strokeWidth={2.4} />
      </div>
      <div
        style={{
          width: 0,
          height: 0,
          marginTop: -2,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `${tail + 2}px solid white`,
        }}
      />
    </div>,
  )

  return L.divIcon({
    className: 'custom-stop-marker',
    html,
    iconSize: [head, head + tail],
    iconAnchor: [head / 2, head + tail],
  })
}

export const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: renderToString(<div className="user-location-pulse" />),
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function createRoutingPinIcon(label: 'A' | 'B') {
  const color = label === 'A' ? 'var(--color-accent-cerulean)' : 'var(--color-accent-warm)'
  const head = 34
  const stem = 10
  const height = head + stem + 4
  const Glyph = label === 'A' ? Footprints : Flag

  const html = renderToString(
    <div
      className="routing-pin-inner"
      style={{
        width: head,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        filter: 'drop-shadow(0 6px 8px rgba(30, 41, 59, 0.28))',
      }}
    >
      <div
        style={{
          width: head,
          height: head,
          borderRadius: '50%',
          background: color,
          border: '3px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Glyph size={16} color="white" strokeWidth={2.5} />
      </div>
      <div style={{ width: 3, height: stem, background: 'white', borderRadius: 2 }} />
      <div
        style={{
          width: 8,
          height: 4,
          borderRadius: '50%',
          background: color,
          opacity: 0.6,
        }}
      />
    </div>,
  )

  return L.divIcon({
    className: 'routing-pin-marker',
    html,
    iconSize: [head, height],
    iconAnchor: [head / 2, height - 2],
  })
}

export const routingPinIconA = createRoutingPinIcon('A')
export const routingPinIconB = createRoutingPinIcon('B')
