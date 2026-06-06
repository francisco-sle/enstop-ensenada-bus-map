import L from 'leaflet'
import { MapPin, Bus } from 'lucide-react'
import { renderToString } from 'react-dom/server'
import { sanitizeColor } from './colorUtils'

// ─── Icon Generation Helpers ─────────────────────────────────────────────────

export function createStopIcon(colorHex: string, isSelected: boolean) {
  const safeColor = sanitizeColor(colorHex)
  const size = isSelected ? 32 : 24
  const pinHtml = renderToString(
    <div style={{
      position: 'relative', width: `${size}px`, height: `${size}px`,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
      transition: 'all 0.2s ease-in-out',
    }}>
      <MapPin size={size} color="#ffffff" fill={safeColor} strokeWidth={1.5} />
      <div style={{
        position: 'absolute', top: '38%', left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center',
      }}>
        <Bus size={isSelected ? 14 : 10} />
      </div>
    </div>
  )
  return L.divIcon({
    className: 'custom-stop-marker',
    html: pinHtml,
    iconSize: [size, size],
    iconAnchor: [size / 2, size * 22 / 24],
  })
}

export const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div class="user-location-pulse"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export function routingPinIcon(label: 'A' | 'B') {
  const bgColor = label === 'A' ? 'var(--color-accent-teal)' : 'var(--color-accent-warm)'
  return L.divIcon({
    className: 'routing-pin-marker',
    html: `<div style="
      background-color: ${bgColor}; color: var(--color-text-inverse);
      font-weight: bold; font-size: 11px; width: 20px; height: 20px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    ">${label}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}
