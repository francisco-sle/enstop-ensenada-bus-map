import L from 'leaflet'
import { renderToString } from 'react-dom/server'
import { sanitizeColor } from './colorUtils'

// ─── Icon Generation Helpers ─────────────────────────────────────────────────

export function createStopIcon(colorHex: string, isSelected: boolean) {
  const safeColor = sanitizeColor(colorHex)
  const width = isSelected ? 36 : 28
  const height = width * 1.3

  const pinHtml = renderToString(
    <div
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        justifyContent: 'center',
        filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 24 31.2"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 0C5.373 0 0 5.373 0 12c0 7.5 12 19.2 12 19.2s12-11.7 12-19.2C24 5.373 18.627 0 12 0z"
          fill={safeColor}
        />
        <circle cx="12" cy="12" r="7.5" fill="white" />
        <g transform="translate(5.5, 5.5) scale(0.54)" fill={safeColor}>
          <rect x="2" y="8" width="3" height="5" rx="1" />
          <rect x="19" y="8" width="3" height="5" rx="1" />
          <rect x="6" y="17" width="3.5" height="5" rx="1" />
          <rect x="14.5" y="17" width="3.5" height="5" rx="1" />
          <rect x="4" y="3" width="16" height="16" rx="2" />
          <rect x="6" y="5" width="5.5" height="6" rx="0.5" fill="white" />
          <rect x="12.5" y="5" width="5.5" height="6" rx="0.5" fill="white" />
          <circle cx="8" cy="15" r="1.5" fill="white" />
          <circle cx="16" cy="15" r="1.5" fill="white" />
        </g>
      </svg>
    </div>,
  )

  return L.divIcon({
    className: 'custom-stop-marker',
    html: pinHtml,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
  })
}

export const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: renderToString(<div className="user-location-pulse" />),
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export function routingPinIcon(label: 'A' | 'B') {
  const bgColor = label === 'A' ? 'var(--color-accent-cerulean)' : 'var(--color-accent-warm)'

  const pinHtml = renderToString(
    <div
      style={{
        backgroundColor: bgColor,
        color: 'var(--color-text-inverse)',
        fontWeight: 'bold',
        fontSize: '11px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      }}
    >
      {label}
    </div>,
  )

  return L.divIcon({
    className: 'routing-pin-marker',
    html: pinHtml,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}
