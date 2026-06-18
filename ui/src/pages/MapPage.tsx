import { useCallback, useState, useEffect } from 'react'
import { Locate, X } from 'lucide-react'
import { BusMap } from '../components/Map/BusMap'
import { RoutePlanner } from '../components/Routing/RoutePlanner'
import { RouteResult } from '../components/Routing/RouteResult'
import { RouteToggleLegend } from '../components/Map/RouteToggleLegend'
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
  const [isLegendMinimized, setIsLegendMinimized] = useState(true)
  // `minimizedForResults` is the specific results array reference the user hid.
  // When routingResults changes (new route computed), the reference differs → auto-expand.
  const [minimizedForResults, setMinimizedForResults] = useState<typeof routingResults | null>(null)

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

        {/* Floating Geolocation Button (Desktop only) */}
        {!isMobile && (
          <button
            onClick={handleLocateUser}
            aria-label="Encontrar mi ubicación actual"
            className="absolute top-5 right-5 z-1000 bg-surface border border-white/8 w-11 h-11 rounded-full flex items-center justify-center shadow-card hover:bg-surface-elevated active:scale-95 transition-all text-pacific-400 cursor-pointer"
          >
            <Locate size={18} />
          </button>
        )}

        {/* Route Toggle Legend (Desktop only) */}
        {!isMobile && (
          <RouteToggleLegend routes={activeRoutes} isMinimizedProp={false} />
        )}

        {/* Mobile Stacked Controls (Bottom Right) */}
        {isMobile && (
          <div className="absolute bottom-5 right-3 z-1000 flex flex-col gap-2 items-end">
            <button
              onClick={handleLocateUser}
              aria-label="Encontrar mi ubicación actual"
              className="bg-surface border border-white/8 w-11 h-11 rounded-xl flex items-center justify-center shadow-card hover:bg-surface-elevated active:scale-95 transition-all text-pacific-400 cursor-pointer"
            >
              <Locate size={18} />
            </button>
            {isLegendMinimized && (
              <RouteToggleLegend
                routes={activeRoutes}
                isMinimizedProp={true}
                onMinimizeChange={setIsLegendMinimized}
              />
            )}
          </div>
        )}

        {/* Mobile Expanded Legend Overlay */}
        {isMobile && !isLegendMinimized && (
          <RouteToggleLegend
            routes={activeRoutes}
            isMinimizedProp={false}
            onMinimizeChange={setIsLegendMinimized}
          />
        )}

        {/* Floating Search Panel (Mobile only) */}
        {isMobile && (
          <div className={
            isMinimized
              ? "absolute top-4 left-4 right-4 z-1000 flex flex-col gap-3"
              : "absolute inset-4 z-1005 bg-surface rounded-2xl border border-white/8 shadow-card flex flex-col p-4 overflow-y-auto animate-slide-down"
          }>
            <RoutePlanner stops={allStops} />
          </div>
        )}

        {/* Slide-up Route Results Drawer (Mobile only) */}
        {isMobile && isMinimized && routingResults.length > 0 && !selectedStop && (
          minimizedForResults === routingResults ? (
            /* Minimized pill — tap to re-expand */
            <button
              onClick={() => setMinimizedForResults(null)}
              className="absolute bottom-0 left-0 right-0 map-overlay-card rounded-t-xl px-4 py-3 z-1001 flex items-center justify-between animate-slide-up select-none cursor-pointer hover:bg-white/5 transition-colors"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-white/70">
                <span>🚌</span>
                <span>Opciones de ruta</span>
                <span className="bg-pacific-500/20 text-pacific-300 rounded-full px-2 py-0.5 text-[10px] font-bold">
                  {routingResults.length} {routingResults.length === 1 ? 'ruta' : 'rutas'}
                </span>
              </span>
              <span className="text-white/40 text-xs">↑ Ver</span>
            </button>
          ) : (
            /* Expanded drawer */
            <div className="absolute bottom-0 left-0 right-0 map-overlay-card rounded-t-2xl p-4 z-1001 max-h-[60%] overflow-y-auto flex flex-col gap-3 animate-slide-up select-none">
              <div className="flex justify-between items-center pb-1 border-b border-white/5">
                <span className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                  <span>🚌</span> Opciones de Ruta
                </span>
                <button
                  onClick={() => setMinimizedForResults(routingResults)}
                  aria-label="Minimizar resultados"
                  className="text-white/50 hover:text-white p-1 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <RouteResult />
            </div>
          )
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
