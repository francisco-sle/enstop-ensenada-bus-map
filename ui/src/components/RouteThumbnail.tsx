import { useMemo } from 'react'
import { MapContainer, TileLayer, Polyline } from 'react-leaflet'
import type { RouteDetail } from '../types'

interface RouteThumbnailProps {
  geom: RouteDetail['geom']
  color: string
  className?: string
}

export function RouteThumbnail({ geom, color, className = '' }: RouteThumbnailProps) {
  const positions = useMemo(() => {
    if (!geom || geom.type !== 'LineString' || !geom.coordinates) return null
    return (geom.coordinates as [number, number][]).map(
      c => [c[1], c[0]] as [number, number]
    )
  }, [geom])

  const bounds = useMemo(() => {
    if (!positions || positions.length === 0) return null
    let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity
    for (const [lat, lng] of positions) {
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
    }
    
    // Zoom in on the route by focusing on the center 65% of the bounding box
    const latCenter = (minLat + maxLat) / 2
    const lngCenter = (minLng + maxLng) / 2
    const latHalfSpan = ((maxLat - minLat) / 2) * 0.65 || 0.002
    const lngHalfSpan = ((maxLng - minLng) / 2) * 0.65 || 0.002

    return [
      [latCenter - latHalfSpan, lngCenter - lngHalfSpan],
      [latCenter + latHalfSpan, lngCenter + lngHalfSpan]
    ] as [[number, number], [number, number]]
  }, [positions])

  if (!positions || !bounds) {
    return (
      <div className={`bg-white/5 flex items-center justify-center ${className}`}>
        <span className="text-white/25 text-[10px]">No map</span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <MapContainer
        bounds={bounds}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        attributionControl={false}
        className="w-full h-full pointer-events-none"
        style={{ width: '100%', height: '100%', background: '#0F1E2E' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution=""
        />
        {/* Glow/Halo Effect for high visibility */}
        <Polyline
          positions={positions}
          color="#ffffff"
          weight={4}
          opacity={0.85}
        />
        <Polyline
          positions={positions}
          color={color}
          weight={2}
          opacity={1.0}
        />
      </MapContainer>
    </div>
  )
}
