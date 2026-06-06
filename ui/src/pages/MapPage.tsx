import { useCallback } from 'react'
import { Locate } from 'lucide-react'
import { BusMap } from '../components/Map/BusMap'
import { RoutePlanner } from '../components/Routing/RoutePlanner'
import { RouteResult } from '../components/Routing/RouteResult'
import { StopDrawer } from '../components/StopDetail/StopDrawer'
import { useMapStore } from '../store/mapStore'
import { useRoutingStore } from '../store/routingStore'
import { useUrlStoreSync } from '../hooks/useUrlStoreSync'
import type { DBStop, RouteDetail } from '../types'

interface MapPageProps {
  activeRoutes: RouteDetail[]
  allStops: DBStop[]
}

export function MapPage({ activeRoutes, allStops }: MapPageProps) {
  const { selectedStopId, setSelectedStopId, setUserLocation, setCenter, setZoom } = useMapStore()
  const { routingResults } = useRoutingStore()

  // Bidirectional URL↔Store sync — handles deep links and browser back/forward
  useUrlStoreSync()

  const selectedStop = allStops.find(s => s.id === selectedStopId)

  const handleLocateUser = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setUserLocation([latitude, longitude])
        setCenter([latitude, longitude])
        setZoom(15)
      },
      (error) => {
        console.warn('Geolocation permission denied or failed:', error)
      }
    )
  }, [setUserLocation, setCenter, setZoom])

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <BusMap activeRoutes={activeRoutes} allStops={allStops} showFullRoutes={false} />
      </div>

      {/* Floating Geolocation Button */}
      <button
        onClick={handleLocateUser}
        aria-label="Encontrar mi ubicación actual"
        className="btn absolute top-5 right-5 z-1000 bg-surface border border-white/8 w-11 h-11 rounded-full flex items-center justify-center shadow-card hover:bg-surface-elevated transition-colors"
      >
        <Locate size={20} className="text-teal-400" />
      </button>

      {/* Floating Search Panel (Left/Top) */}
      <div className="absolute top-5 left-5 z-1000 w-[calc(100%-40px)] max-w-[360px] flex flex-col gap-3">
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
