import { useMemo } from 'react'
import type { RouteDetail } from '../types'

interface RouteThumbnailProps {
  geom: RouteDetail['geom']
  color: string
  className?: string
}

const VIEW = 100
const PAD = 12

/**
 * Lightweight SVG silhouette of a route — no map tiles, no Leaflet instance.
 * Projects lon/lat with a cos(lat) correction and fits the line into a square.
 */
export function RouteThumbnail({ geom, color, className = '' }: RouteThumbnailProps) {
  const path = useMemo(() => {
    if (!geom || geom.type !== 'LineString' || !geom.coordinates?.length) return null
    const coords = geom.coordinates as [number, number][]

    const midLat = coords.reduce((sum, [, lat]) => sum + lat, 0) / coords.length
    const kx = Math.cos((midLat * Math.PI) / 180)
    const pts = coords.map(([lng, lat]) => [lng * kx, -lat] as const)

    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1
    const scale = (VIEW - PAD * 2) / span
    const offX = (VIEW - (Math.max(...xs) - minX) * scale) / 2
    const offY = (VIEW - (Math.max(...ys) - minY) * scale) / 2

    const projected = pts.map(
      ([x, y]) => [(x - minX) * scale + offX, (y - minY) * scale + offY] as const,
    )
    return {
      d: projected.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(''),
      start: projected[0],
      end: projected[projected.length - 1],
    }
  }, [geom])

  return (
    <div
      className={`relative overflow-hidden bg-[radial-gradient(circle_at_30%_20%,var(--color-paper),var(--color-mist))] ${className}`}
    >
      {path && (
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="absolute inset-0 w-full h-full" aria-hidden>
          <defs>
            <pattern id="thumb-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M10 0H0V10" fill="none" stroke="var(--color-line)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={VIEW} height={VIEW} fill="url(#thumb-grid)" opacity="0.7" />
          <path
            d={path.d}
            pathLength={1}
            fill="none"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="thumb-draw"
          />
          <path
            d={path.d}
            pathLength={1}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="thumb-draw"
          />
          <circle
            cx={path.start[0]}
            cy={path.start[1]}
            r="3.2"
            fill="white"
            stroke={color}
            strokeWidth="2"
          />
          <circle
            cx={path.end[0]}
            cy={path.end[1]}
            r="3.2"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </div>
  )
}
