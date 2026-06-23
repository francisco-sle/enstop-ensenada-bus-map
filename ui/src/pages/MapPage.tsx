import { useCallback, useState, useEffect, useRef } from 'react'
import { Locate, X, Info, Map } from 'lucide-react'
import { BusMap } from '../components/Map/BusMap'
import { RoutePlanner } from '../components/Routing/RoutePlanner'
import { RouteResult } from '../components/Routing/RouteResult'
import { RouteToggleLegend } from '../components/Map/RouteToggleLegend'
import { StopDrawer } from '../components/StopDetail/StopDrawer'
import { LegalLinks } from '../components/Legal/LegalModals'
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
  const { routingResults, selectedResultIndex, isMinimized, origin, destination } =
    useRoutingStore()
  const isMobile = useIsMobile()
  const [isLegendMinimized, setIsLegendMinimized] = useState(true)
  // `minimizedForResults` is the specific results array reference the user hid.
  // When routingResults changes (new route computed), the reference differs → auto-expand.
  const [minimizedForResults, setMinimizedForResults] = useState<typeof routingResults | null>(null)
  // Controls exit animation on the expanded drawer before it unmounts
  const [isCollapsing, setIsCollapsing] = useState(false)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  // Bumped each time the pill mounts so animate-slide-up always replays
  const [pillKey, setPillKey] = useState(0)

  // Bidirectional URL↔Store sync — handles deep links and browser back/forward
  useUrlStoreSync()

  const selectedStop = allStops.find((s) => s.id === selectedStopId)

  const prevOrigin = useRef(origin)
  const prevDest = useRef(destination)
  const prevResultIndex = useRef(selectedResultIndex)

  useEffect(() => {
    const originChanged = origin !== prevOrigin.current
    const destChanged = destination !== prevDest.current
    const resultIndexChanged = selectedResultIndex !== prevResultIndex.current

    if (originChanged || destChanged || resultIndexChanged) {
      if (selectedStopId) {
        setSelectedStopId(null)
      }
      prevOrigin.current = origin
      prevDest.current = destination
      prevResultIndex.current = selectedResultIndex
    }
  }, [origin, destination, selectedResultIndex, selectedStopId, setSelectedStopId])

  const handleLocateUser = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setUserLocation([latitude, longitude])
        setCenter([latitude, longitude])
        setZoom(15)
      },
      (error) => {
        console.warn('Geolocation permission denied or failed:', error)
      },
    )
  }, [setUserLocation, setCenter, setZoom])

  const handleMinimizeResults = useCallback(() => {
    setIsCollapsing(true)
    setTimeout(() => {
      setPillKey((k) => k + 1)
      setMinimizedForResults(routingResults)
      setIsCollapsing(false)
    }, 250)
  }, [routingResults])

  // True when the minimized "Opciones de Ruta" pill is anchored at the bottom
  const showMinimizedPill =
    isMobile &&
    isMinimized &&
    routingResults.length > 0 &&
    !selectedStop &&
    minimizedForResults === routingResults

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden relative bg-bay-950">
      {/* Sidebar Panel (Desktop only) */}
      {!isMobile && (
        <div className="w-[380px] lg:w-[420px] shrink-0 bg-bay-950 flex flex-col gap-4 p-4 overflow-y-auto z-10 select-none">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-white">Planificador de Rutas</h2>
            <p className="text-xs text-white/55">
              Busca paradas para planificar tu ruta en Ensenada.
            </p>
          </div>
          <RoutePlanner stops={allStops} routes={activeRoutes} />

          {routingResults.length > 0 ? (
            <div className="mt-2 flex flex-col gap-3 flex-1 min-h-0">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider shrink-0">
                Opciones de Ruta
              </h3>
              <div className="overflow-y-auto min-h-0">
                <RouteResult />
              </div>
              <div className="mt-auto shrink-0 pt-2 pb-1">
                <div className="flex gap-2 items-center justify-center bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-[10px] text-amber-300 select-none">
                  <Info size={14} className="shrink-0" />
                  <span className="leading-tight">
                    Tiempos estimados. El tráfico y servicio pueden variar.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 select-none animate-fade-up pb-10">
              <Map size={48} className="text-white opacity-[0.15] mb-4" strokeWidth={1.5} />
              <p className="text-sm text-white/30 font-medium leading-relaxed">
                {origin && destination
                  ? 'No se encontraron rutas para estos puntos.'
                  : 'Ingresa origen y destino para ver opciones de ruta.'}
              </p>
            </div>
          )}

          {/* Legal Links for Desktop Sidebar */}
          <div className="shrink-0 flex justify-center pt-2">
            <LegalLinks />
          </div>
        </div>
      )}

      {/* Map View Area */}
      <div className="flex-1 h-full w-full relative min-h-0 md:p-2 md:pl-0 lg:p-2.5 lg:pl-0">
        <div className="w-full h-full relative md:rounded-lg lg:rounded-lg overflow-hidden md:border md:border-white/10 md:shadow-card">
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
          {!isMobile && <RouteToggleLegend routes={activeRoutes} />}

          {/* Floating Stop Detail Drawer (Desktop only) */}
          {!isMobile && selectedStop && (
            <div className="absolute top-5 left-5 z-1000 w-[320px]">
              <StopDrawer
                key={selectedStop.id}
                stop={selectedStop}
                activeRoutes={activeRoutes}
                onClose={() => setSelectedStopId(null)}
                variant="floating"
              />
            </div>
          )}

          {/* Mobile Stacked Controls (Bottom Right) */}
          {isMobile && (
            <div
              className={`absolute right-3 z-1000 flex flex-col gap-2 items-end transition-all duration-[250ms] ${
                showMinimizedPill ? 'bottom-[60px]' : 'bottom-5'
              }`}
            >
              <button
                onClick={handleLocateUser}
                aria-label="Encontrar mi ubicación actual"
                className="bg-surface border border-white/8 w-11 h-11 rounded-lg flex items-center justify-center shadow-card hover:bg-surface-elevated active:scale-95 transition-all text-pacific-400 cursor-pointer"
              >
                <Locate size={18} />
              </button>
              {activeRoutes.length > 0 && (
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isLegendMinimized ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-visible min-h-0">
                    <RouteToggleLegend
                      routes={activeRoutes}
                      isMinimizedProp={true}
                      onMinimizeChange={setIsLegendMinimized}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Expanded Legend Overlay */}
          {isMobile && !isLegendMinimized && (
            <RouteToggleLegend
              routes={activeRoutes}
              isMinimizedProp={false}
              onMinimizeChange={setIsLegendMinimized}
              pushedUp={showMinimizedPill}
            />
          )}

          {/* Floating Search Panel (Mobile only) */}
          {isMobile && (
            <div className="absolute inset-0 z-[1005] pointer-events-none flex flex-col overflow-hidden">
              <RoutePlanner stops={allStops} routes={activeRoutes} />
            </div>
          )}

          {/* Slide-up Route Results Drawer (Mobile only) */}
          {isMobile &&
            isMinimized &&
            routingResults.length > 0 &&
            !selectedStop &&
            (minimizedForResults === routingResults ? (
              /* Minimized pill — key forces remount so animate-slide-up always plays */
              <button
                key={pillKey}
                onClick={() => setMinimizedForResults(null)}
                onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
                onTouchEnd={(e) => {
                  if (touchStartY === null) return
                  if (touchStartY - e.changedTouches[0].clientY > 40) setMinimizedForResults(null)
                  setTouchStartY(null)
                }}
                className="absolute bottom-0 left-0 right-0 map-overlay-card rounded-t-lg px-4 py-3 z-1001 flex items-center justify-between animate-slide-up select-none cursor-pointer hover:bg-white/5 transition-colors"
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
              /* Expanded drawer — plays exit animation before state switches to pill */
              <div
                className={`absolute bottom-0 left-0 right-0 map-overlay-card rounded-t-lg pt-4 pb-0 px-4 z-1001 max-h-[60%] flex flex-col gap-3 select-none overflow-hidden ${
                  isCollapsing ? 'animate-slide-down-fade' : 'animate-slide-up'
                }`}
              >
                <div
                  className="flex flex-col items-center pb-2 cursor-grab active:cursor-grabbing border-b border-white/5 shrink-0"
                  onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
                  onTouchEnd={(e) => {
                    if (touchStartY === null) return
                    if (e.changedTouches[0].clientY - touchStartY > 40) handleMinimizeResults()
                    setTouchStartY(null)
                  }}
                >
                  <div className="w-12 h-1.5 bg-white/20 rounded-full mb-3" />
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                      <span>🚌</span> Opciones de Ruta
                    </span>
                    <button
                      onClick={handleMinimizeResults}
                      aria-label="Minimizar resultados"
                      className="text-white/50 hover:text-white p-1 transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 min-h-0 pb-4 flex flex-col">
                  <RouteResult />
                  <div className="mt-auto shrink-0 pt-4">
                    <div className="flex gap-2 items-center justify-center bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-[10px] text-amber-300 select-none">
                      <Info size={14} className="shrink-0" />
                      <span className="leading-tight">
                        Tiempos estimados. El tráfico y servicio pueden variar.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {/* Slide-up Stop Detail Drawer (Mobile only) */}
          {isMobile && selectedStop && (
            <StopDrawer
              key={selectedStop.id}
              stop={selectedStop}
              activeRoutes={activeRoutes}
              onClose={() => setSelectedStopId(null)}
              variant="drawer"
            />
          )}
        </div>
      </div>
    </div>
  )
}
