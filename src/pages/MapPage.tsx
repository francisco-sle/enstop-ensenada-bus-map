import { useEffect } from 'react'
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

export function MapPage({ activeRoutes, allStops }: MapPageProps) {
  const { selectedStopId, setSelectedStopId, setUserLocation, setCenter, setZoom } = useMapStore()
  const { origin, destination, routingResults, setOrigin, setDestination } = useRoutingStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedStop = allStops.find(s => s.id === selectedStopId)

  // 1. Sync from URL to Store on Mount / URL change
  useEffect(() => {
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    if (fromParam) {
      const [lat, lng] = fromParam.split(',').map(Number)
      if (!isNaN(lat) && !isNaN(lng)) {
        if (!origin || Math.abs(origin.lat - lat) > 0.0001 || Math.abs(origin.lng - lng) > 0.0001) {
          setOrigin({ lat, lng, label: `Punto en Mapa (${lat.toFixed(4)}, ${lng.toFixed(4)})` })
        }
      }
    }

    if (toParam) {
      const [lat, lng] = toParam.split(',').map(Number)
      if (!isNaN(lat) && !isNaN(lng)) {
        if (!destination || Math.abs(destination.lat - lat) > 0.0001 || Math.abs(destination.lng - lng) > 0.0001) {
          setDestination({ lat, lng, label: `Punto en Mapa (${lat.toFixed(4)}, ${lng.toFixed(4)})` })
        }
      }
    }
  }, [searchParams, setOrigin, setDestination, origin, destination])

  // 2. Sync from Store to URL on store state changes
  useEffect(() => {
    const params: Record<string, string> = {}
    if (origin) {
      params.from = `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`
    }
    if (destination) {
      params.to = `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`
    }
    // Only update if parameters actually changed to prevent loop
    const currentFrom = searchParams.get('from')
    const currentTo = searchParams.get('to')
    if (params.from !== currentFrom || params.to !== currentTo) {
      setSearchParams(params, { replace: true })
    }
  }, [origin, destination, setSearchParams, searchParams])

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
      <div className="absolute top-5 left-5 z-[1000] w-[calc(100%-40px)] max-w-[360px] max-h-[calc(100%-120px)] overflow-y-auto flex flex-col gap-3">
        {/* Route Planner Form */}
        <RoutePlanner stops={allStops} />

        {/* Route Computation Results */}
        {routingResults.length > 0 && (
          <div className="bg-surface rounded-xl border border-white/8 p-3 shadow-card animate-fade-up">
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
