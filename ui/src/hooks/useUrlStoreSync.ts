import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useRoutingStore } from '../store/routingStore'

type Coords = { lat: number; lng: number } | null

/**
 * Returns true when two coordinate objects are within 0.0001° of each other,
 * or when both are null. Used to break URL↔Store synchronization cycles.
 */
function areCoordsEqual(c1: Coords, c2: Coords): boolean {
  if (!c1 && !c2) return true
  if (!c1 || !c2) return false
  return Math.abs(c1.lat - c2.lat) < 0.0001 && Math.abs(c1.lng - c2.lng) < 0.0001
}

/**
 * Parses a "lat,lng" search param string into a Coords object.
 * Returns null if the param is absent or malformed.
 */
function parseCoordsParam(param: string | null): Coords {
  if (!param) return null
  const [lat, lng] = param.split(',').map(Number)
  if (isNaN(lat) || isNaN(lng)) return null
  return { lat, lng }
}

/**
 * Bidirectional URL↔Store synchronization for routing origin/destination.
 *
 * Strategy:
 *   - Effect 1 reads the URL (`?from=lat,lng&to=lat,lng`) and pushes changes
 *     into the routing store (handles browser back/forward and deep links).
 *   - Effect 2 reads the store and updates the URL (handles in-app interactions).
 *   - A shared `lastSyncedRef` tracks the last committed coordinates so that
 *     each effect can detect whether it triggered the other and bail out,
 *     preventing an infinite ping-pong update loop.
 *
 * @example
 * // Inside MapPage:
 * useUrlStoreSync()
 * // Now `?from=31.86,-116.60&to=31.83,-116.62` automatically populates the store.
 */
export function useUrlStoreSync() {
  const { origin, destination, setOrigin, setDestination } = useRoutingStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const lastSyncedRef = useRef<{ origin: Coords; destination: Coords }>({
    origin: null,
    destination: null,
  })

  // Effect 1: URL → Store (on mount and browser navigation)
  useEffect(() => {
    const urlOrigin = parseCoordsParam(searchParams.get('from'))
    const urlDest = parseCoordsParam(searchParams.get('to'))

    const originMatches = areCoordsEqual(urlOrigin, lastSyncedRef.current.origin)
    const destMatches = areCoordsEqual(urlDest, lastSyncedRef.current.destination)
    if (originMatches && destMatches) return

    lastSyncedRef.current = { origin: urlOrigin, destination: urlDest }

    const currentOrigin = useRoutingStore.getState().origin
    const currentDest = useRoutingStore.getState().destination

    if (urlOrigin) {
      if (!currentOrigin || !areCoordsEqual(currentOrigin, urlOrigin)) {
        setOrigin({
          lat: urlOrigin.lat,
          lng: urlOrigin.lng,
          label: `Punto en Mapa (${urlOrigin.lat.toFixed(4)}, ${urlOrigin.lng.toFixed(4)})`,
        })
      }
    } else {
      if (currentOrigin) setOrigin(null)
    }

    if (urlDest) {
      if (!currentDest || !areCoordsEqual(currentDest, urlDest)) {
        setDestination({
          lat: urlDest.lat,
          lng: urlDest.lng,
          label: `Punto en Mapa (${urlDest.lat.toFixed(4)}, ${urlDest.lng.toFixed(4)})`,
        })
      }
    } else {
      if (currentDest) setDestination(null)
    }
  }, [searchParams, setOrigin, setDestination])

  // Effect 2: Store → URL (on in-app state changes)
  useEffect(() => {
    const originMatches = areCoordsEqual(origin, lastSyncedRef.current.origin)
    const destMatches = areCoordsEqual(destination, lastSyncedRef.current.destination)
    if (originMatches && destMatches) return

    lastSyncedRef.current = {
      origin: origin ? { lat: origin.lat, lng: origin.lng } : null,
      destination: destination ? { lat: destination.lat, lng: destination.lng } : null,
    }

    const nextParams: Record<string, string> = {}
    if (origin) nextParams.from = `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`
    if (destination) nextParams.to = `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`

    setSearchParams(nextParams, { replace: true })
  }, [origin, destination, setSearchParams])
}
