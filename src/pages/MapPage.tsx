import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Locate } from 'lucide-react'
import { BusMap } from '../components/Map/BusMap'
import { RoutePlanner } from '../components/Routing/RoutePlanner'
import { RouteResult } from '../components/Routing/RouteResult'
import { StopDrawer } from '../components/StopDetail/StopDrawer'
import { useMapStore } from '../store/mapStore'
import { useRoutingStore } from '../store/routingStore'
import type { DBStop, RouteDetail } from '../types'

interface MapPageProps {
  activeRoutes: RouteDetail[]
  allStops: DBStop[]
}

const areCoordsEqual = (
  c1: { lat: number; lng: number } | null,
  c2: { lat: number; lng: number } | null
) => {
  if (!c1 && !c2) return true
  if (!c1 || !c2) return false
  return Math.abs(c1.lat - c2.lat) < 0.0001 && Math.abs(c1.lng - c2.lng) < 0.0001
}

export function MapPage({ activeRoutes, allStops }: MapPageProps) {
  const { selectedStopId, setSelectedStopId, setUserLocation, setCenter, setZoom } = useMapStore()
  const { origin, destination, routingResults, setOrigin, setDestination } = useRoutingStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedStop = allStops.find(s => s.id === selectedStopId)

  // Track coordinates last synchronized to avoid loops/race conditions
  const lastSyncedRef = useRef<{
    origin: { lat: number; lng: number } | null
    destination: { lat: number; lng: number } | null
  }>({ origin: null, destination: null })

  // 1. Sync from URL to Store on Mount / URL change (browser navigation)
  useEffect(() => {
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    let urlOrigin: { lat: number; lng: number } | null = null
    if (fromParam) {
      const [lat, lng] = fromParam.split(',').map(Number)
      if (!isNaN(lat) && !isNaN(lng)) {
        urlOrigin = { lat, lng }
      }
    }

    let urlDest: { lat: number; lng: number } | null = null
    if (toParam) {
      const [lat, lng] = toParam.split(',').map(Number)
      if (!isNaN(lat) && !isNaN(lng)) {
        urlDest = { lat, lng }
      }
    }

    // Check if the URL coordinates match our last synced state.
    // If they do, skip store updates to prevent loops.
    const originMatches = areCoordsEqual(urlOrigin, lastSyncedRef.current.origin)
    const destMatches = areCoordsEqual(urlDest, lastSyncedRef.current.destination)
    if (originMatches && destMatches) {
      return
    }

    // Update reference
    lastSyncedRef.current = { origin: urlOrigin, destination: urlDest }

    // Sync store with URL using getState to avoid useEffect dependency on origin/destination
    const currentStoreOrigin = useRoutingStore.getState().origin
    const currentStoreDest = useRoutingStore.getState().destination

    if (urlOrigin) {
      if (!currentStoreOrigin || !areCoordsEqual(currentStoreOrigin, urlOrigin)) {
        setOrigin({
          lat: urlOrigin.lat,
          lng: urlOrigin.lng,
          label: `Punto en Mapa (${urlOrigin.lat.toFixed(4)}, ${urlOrigin.lng.toFixed(4)})`
        })
      }
    } else {
      if (currentStoreOrigin) setOrigin(null)
    }

    if (urlDest) {
      if (!currentStoreDest || !areCoordsEqual(currentStoreDest, urlDest)) {
        setDestination({
          lat: urlDest.lat,
          lng: urlDest.lng,
          label: `Punto en Mapa (${urlDest.lat.toFixed(4)}, ${urlDest.lng.toFixed(4)})`
        })
      }
    } else {
      if (currentStoreDest) setDestination(null)
    }
  }, [searchParams, setOrigin, setDestination])

  // 2. Sync from Store to URL on store state changes
  useEffect(() => {
    // If the store coordinates match our last synced state, do nothing
    const originMatches = areCoordsEqual(origin, lastSyncedRef.current.origin)
    const destMatches = areCoordsEqual(destination, lastSyncedRef.current.destination)
    if (originMatches && destMatches) {
      return
    }

    // Update reference
    lastSyncedRef.current = {
      origin: origin ? { lat: origin.lat, lng: origin.lng } : null,
      destination: destination ? { lat: destination.lat, lng: destination.lng } : null
    }

    // Update URL query parameters
    const nextParams: Record<string, string> = {}
    if (origin) {
      nextParams.from = `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`
    }
    if (destination) {
      nextParams.to = `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`
    }

    setSearchParams(nextParams, { replace: true })
  }, [origin, destination, setSearchParams])

  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])
          setCenter([latitude, longitude])
          setZoom(15)
        },
        (error) => {
          console.warn('Geolocation permission denied or failed:', error)
        }
      )
    }
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <BusMap activeRoutes={activeRoutes} allStops={allStops} />
      </div>

      {/* Floating Geolocation Button */}
      <button
        onClick={handleLocateUser}
        aria-label="Encontrar mi ubicación actual"
        className="btn absolute top-5 right-5 z-[1000] bg-surface border border-white/8 w-11 h-11 rounded-full flex items-center justify-center shadow-card hover:bg-surface-elevated transition-colors"
      >
        <Locate size={20} className="text-teal-400" />
      </button>

      {/* Floating Search Panel (Left/Top) */}
      <div className="absolute top-5 left-5 z-[1000] w-[calc(100%-40px)] max-w-[360px] flex flex-col gap-3">
        {/* Route Planner Form — overflow-visible so the autocomplete dropdown is not clipped */}
        <RoutePlanner stops={allStops} />

        {/* Route Computation Results — independently scrollable */}
        {routingResults.length > 0 && (
          <div className="bg-surface rounded-xl border border-white/8 p-3 shadow-card animate-fade-up max-h-[calc(100vh-240px)] overflow-y-auto">
            <RouteResult />
          </div>
        )}
      </div>

      {/* Slide-up Stop Detail Drawer */}
      {selectedStop && (
        <StopDrawer key={selectedStop.id} stop={selectedStop} onClose={() => setSelectedStopId(null)} />
      )}
    </div>
  )
}
