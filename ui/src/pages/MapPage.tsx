import { useCallback, useState, useEffect } from 'react'
import { Locate } from 'lucide-react'
import { BusMap } from '../components/Map/BusMap'
import { RoutePlanner } from '../components/Routing/RoutePlanner'
import { RouteResult } from '../components/Routing/RouteResult'
import { StopDrawer } from '../components/StopDetail/StopDrawer'
import { useMapStore } from '../store/mapStore'
import { useRoutingStore } from '../store/routingStore'
import { useUrlStoreSync } from '../hooks/useUrlStoreSync'
import type { DBStop, RouteDetail } from '../types'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile
}

interface MapPageProps {
  activeRoutes: RouteDetail[]
  allStops: DBStop[]
}

export function MapPage({ activeRoutes, allStops }: MapPageProps) {
  const { selectedStopId, setSelectedStopId, setUserLocation, setCenter, setZoom } = useMapStore()
  const { routingResults, isMinimized } = useRoutingStore()
  const isMobile = useIsMobile()

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
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden relative">
      {/* Sidebar Panel (Desktop only) */}
      {!isMobile && (
        <div className="w-[380px] lg:w-[420px] shrink-0 bg-surface border-r border-white/8 flex flex-col gap-4 p-4 overflow-y-auto z-10 select-none">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-white">Planificador de Rutas</h2>
            <p className="text-xs text-white/55">Busca paradas para planificar tu ruta en Ensenada.</p>
          </div>
          <RoutePlanner stops={allStops} />

          {routingResults.length > 0 && (
            <div className="mt-2 flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Opciones de Ruta</h3>
              <RouteResult />
            </div>
          )}

          {selectedStop && (
            <StopDrawer
              key={selectedStop.id}
              stop={selectedStop}
              onClose={() => setSelectedStopId(null)}
              variant="inline"
            />
          )}
        </div>
      )}

      {/* Map View Area */}
      <div className="flex-1 h-full w-full relative min-h-0">
        {/* Map Background */}
        <div className="absolute inset-0 z-0">
          <BusMap activeRoutes={activeRoutes} allStops={allStops} showFullRoutes={true} />
        </div>

        {/* Floating Geolocation Button */}
        <button
          onClick={handleLocateUser}
          aria-label="Encontrar mi ubicación actual"
          className="btn absolute top-5 right-5 z-1000 bg-surface border border-white/8 w-11 h-11 rounded-full flex items-center justify-center shadow-card hover:bg-surface-elevated transition-colors"
        >
          <Locate size={20} className="text-pacific-400" />
        </button>

        {/* Floating Search Panel (Mobile only) */}
        {isMobile && (
          <div className="absolute top-5 left-5 z-1000 w-[calc(100%-96px)] max-w-[480px] max-h-[calc(100%-40px)] flex flex-col gap-3">
            <RoutePlanner stops={allStops} />
            {!isMinimized && routingResults.length > 0 && (
              <div className="bg-surface rounded-xl border border-white/8 p-3 shadow-card animate-fade-up overflow-y-auto min-h-0 flex-1">
                <RouteResult />
              </div>
            )}
          </div>
        )}

        {/* Slide-up Stop Detail Drawer (Mobile only) */}
        {isMobile && selectedStop && (
          <StopDrawer
            key={selectedStop.id}
            stop={selectedStop}
            onClose={() => setSelectedStopId(null)}
            variant="drawer"
          />
        )}
      </div>
    </div>
  )
}
