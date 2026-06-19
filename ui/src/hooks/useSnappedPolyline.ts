import { useState, useEffect } from 'react'

const osrmCache = new Map<string, [number, number][]>()

function coordsEqual(a: [number, number][], b: [number, number][]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false
  }
  return true
}

/**
 * Reusable hook to snap a set of coordinates to the nearest street network
 * using the OSRM public API. Falls back to original coordinates on error/load.
 */
export function useSnappedPolyline(
  coords: [number, number][],
  profile: 'foot' | 'driving',
  enabled: boolean = true,
) {
  const cacheKey = `${profile}:${coords.map((c) => `${c[0]},${c[1]}`).join(';')}`
  const cached = osrmCache.get(cacheKey)
  const needsFetch = enabled && coords.length >= 2 && !cached

  const [prevCoords, setPrevCoords] = useState<[number, number][]>(coords)
  const [snappedCoords, setSnappedCoords] = useState<[number, number][]>(cached || coords)
  const [isLoading, setIsLoading] = useState(needsFetch)

  if (!coordsEqual(coords, prevCoords)) {
    setPrevCoords(coords)
    setSnappedCoords(cached || coords)
    setIsLoading(needsFetch)
  }

  useEffect(() => {
    if (!enabled || coords.length < 2 || osrmCache.has(cacheKey)) {
      return
    }

    let active = true

    // OSRM expects coordinates in [lng, lat] format
    const queryCoords = coords.map((c) => `${c[1]},${c[0]}`).join(';')
    const url = `https://router.project-osrm.org/route/v1/${profile}/${queryCoords}?overview=full&geometries=geojson`

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`OSRM request failed: ${res.statusText}`)
        return res.json()
      })
      .then((data) => {
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const snapped = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number],
          )
          osrmCache.set(cacheKey, snapped)
          if (active) {
            setSnappedCoords(snapped)
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch snapped route from OSRM:', err)
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [coords, profile, enabled, cacheKey])

  return { snappedCoords, isLoading }
}
