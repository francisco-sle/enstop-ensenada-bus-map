import { useCallback, useState, useEffect, useRef } from 'react'
import { Locate, Info, BusFront, ChevronUp, ChevronDown } from 'lucide-react'
import type { MapInsets } from '../components/Map/mapControls'
import { BusMap } from '../components/Map/BusMap'
import { RoutePlanner } from '../components/Routing/RoutePlanner'
import { RouteResult } from '../components/Routing/RouteResult'
import { RouteExplorer } from '../components/RouteExplorer/RouteExplorer'
import {
  RouteExplorerPill,
  RouteExplorerSheet,
} from '../components/RouteExplorer/RouteExplorerSheet'
import { StopDrawer } from '../components/StopDetail/StopDrawer'
import { LegalLinks } from '../components/Legal/LegalModals'
import { useMapStore } from '../store/mapStore'
import { useRoutingStore } from '../store/routingStore'
import { useUrlStoreSync } from '../hooks/useUrlStoreSync'
import { useIsMobile } from '../hooks/useIsMobile'
import { Logo } from '../components/Logo'
import type { DBStop, RouteDetail } from '../types'

// Map area hidden behind floating UI. Desktop: the 372px panel plus its 16px gutters.
// Mobile: the search bar on top and the nav dock below.
const DESKTOP_INSETS: MapInsets = { left: 404 }
const MOBILE_INSETS: MapInsets = { top: 76, bottom: 96 }

type PanelTab = 'plan' | 'routes'

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
  const [panelTab, setPanelTab] = useState<PanelTab>('plan')
  const shownCount = useMapStore((s) => s.shownRouteIds.length)

  // Planning a trip (e.g. from the context menu or a stop) brings the planner tab back
  const isTripActive = origin !== null || destination !== null
  const [prevTripActive, setPrevTripActive] = useState(isTripActive)
  if (isTripActive !== prevTripActive) {
    setPrevTripActive(isTripActive)
    if (isTripActive) setPanelTab('plan')
  }
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

  const disclaimer = (
    <p className="flex items-center justify-center gap-1.5 text-[11px] text-ink-faint font-medium mt-3 select-none">
      <Info size={12} className="shrink-0" />
      Tiempos estimados; el tráfico y el servicio pueden variar.
    </p>
  )

  return (
    <div className="map-page relative w-full h-full overflow-hidden">
      {/* Map Background — full bleed */}
      <div className="absolute inset-0 z-0">
        <BusMap
          activeRoutes={activeRoutes}
          allStops={allStops}
          showFullRoutes={true}
          insets={isMobile ? MOBILE_INSETS : DESKTOP_INSETS}
        />
      </div>

      {/* ── Desktop ─────────────────────────────────────────────────────── */}
      {!isMobile && (
        <>
          {/* Floating planner panel */}
          <aside className="absolute top-4 left-4 bottom-4 w-[372px] z-1001 flex flex-col pointer-events-none">
            <div className="glass rounded-4xl flex flex-col min-h-0 max-h-full pointer-events-auto animate-enter">
              <div className="px-5 pt-5 pb-4 flex flex-col gap-1.5 shrink-0">
                <Logo className="text-[28px] text-ink" />
                <p className="text-xs text-ink-faint font-medium">
                  Planifica tu viaje en microbús por Ensenada.
                </p>
              </div>

              <div
                role="tablist"
                aria-label="Panel"
                className="mx-4 mb-4 p-1 rounded-full bg-mist flex shrink-0"
              >
                {(
                  [
                    ['plan', 'Planear viaje'],
                    ['routes', 'Rutas'],
                  ] as const
                ).map(([tab, label]) => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={panelTab === tab}
                    onClick={() => setPanelTab(tab)}
                    className={`flex-1 h-9 rounded-full text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-[background-color,color,box-shadow] duration-300 ${
                      panelTab === tab
                        ? 'bg-paper text-ink shadow-soft'
                        : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    {label}
                    {tab === 'routes' && shownCount > 0 && (
                      <span className="bg-accent-tint text-accent-strong rounded-full px-1.5 min-w-5 text-[10px] font-bold">
                        {shownCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Planner stays mounted on the routes tab — it owns the route computation */}
              <div className={panelTab === 'plan' ? 'contents' : 'hidden'}>
                <div className="px-4 pb-4 shrink-0">
                  <RoutePlanner stops={allStops} routes={activeRoutes} />
                </div>

                {routingResults.length > 0 ? (
                  <div className="border-t border-line flex-1 min-h-0 overflow-y-auto px-4 py-4">
                    <RouteResult />
                    {disclaimer}
                  </div>
                ) : (
                  origin &&
                  destination && (
                    <p className="px-6 pb-5 text-xs text-ink-faint text-center animate-enter">
                      No se encontraron rutas para estos puntos.
                    </p>
                  )
                )}
              </div>

              {panelTab === 'routes' && (
                <div className="flex flex-col min-h-0 flex-1 px-3 animate-enter">
                  <RouteExplorer routes={activeRoutes} />
                </div>
              )}

              <div className="border-t border-line py-3 flex justify-center shrink-0">
                <LegalLinks />
              </div>
            </div>
          </aside>

          {/* Stop detail — floats beside the planner */}
          {selectedStop && (
            <div className="absolute top-19 xl:top-4 left-[404px] z-1000 w-[340px]">
              <StopDrawer
                key={selectedStop.id}
                stop={selectedStop}
                activeRoutes={activeRoutes}
                onClose={() => setSelectedStopId(null)}
                variant="floating"
              />
            </div>
          )}

          {/* Bottom-right controls */}
          <div className="absolute right-4 bottom-8 z-1000 flex flex-col items-end gap-3">
            <button
              onClick={handleLocateUser}
              aria-label="Encontrar mi ubicación actual"
              className="fab w-12 h-12 text-accent hover:text-accent-strong"
            >
              <Locate size={19} />
            </button>
          </div>
        </>
      )}

      {/* ── Mobile ──────────────────────────────────────────────────────── */}
      {isMobile && (
        <>
          {/* Right-hand controls, lifted above the dock (and the results pill) */}
          <div
            className="absolute right-3 z-1000 flex flex-col gap-2.5 items-end transition-[bottom] duration-500"
            style={{
              bottom: `calc(var(--dock-h) + ${showMinimizedPill ? 64 : 12}px)`,
              transitionTimingFunction: 'var(--ease-spring)',
            }}
          >
            <button
              onClick={handleLocateUser}
              aria-label="Encontrar mi ubicación actual"
              className="fab w-12 h-12 text-accent"
            >
              <Locate size={19} />
            </button>
            {activeRoutes.length > 0 && isLegendMinimized && (
              <RouteExplorerPill
                routes={activeRoutes}
                onExpand={() => setIsLegendMinimized(false)}
              />
            )}
          </div>

          {/* Expanded legend sheet */}
          {!isLegendMinimized && (
            <div
              className="absolute left-3 right-3 z-1001 transition-[bottom] duration-500"
              style={{
                bottom: `calc(var(--dock-h) + ${showMinimizedPill ? 64 : 0}px)`,
                transitionTimingFunction: 'var(--ease-spring)',
              }}
            >
              <RouteExplorerSheet
                routes={activeRoutes}
                onCollapse={() => setIsLegendMinimized(true)}
              />
            </div>
          )}

          {/* Search bar / expanded planner */}
          <div className="absolute inset-0 z-1005 pointer-events-none flex flex-col overflow-hidden">
            <RoutePlanner stops={allStops} routes={activeRoutes} />
          </div>

          {/* Route results — minimized pill or expanded sheet */}
          {isMinimized &&
            routingResults.length > 0 &&
            !selectedStop &&
            (minimizedForResults === routingResults ? (
              /* key forces remount so the entrance always replays */
              <button
                key={pillKey}
                onClick={() => setMinimizedForResults(null)}
                onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
                onTouchEnd={(e) => {
                  if (touchStartY === null) return
                  if (touchStartY - e.changedTouches[0].clientY > 40) setMinimizedForResults(null)
                  setTouchStartY(null)
                }}
                className="glass absolute left-3 right-3 bottom-(--dock-h) z-1001 h-13 rounded-full pl-2 pr-4 flex items-center justify-between animate-sheet-in select-none cursor-pointer active:scale-[0.98] transition-[scale]"
              >
                <span className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                  <span className="w-9 h-9 rounded-full bg-pacific-500 text-white flex items-center justify-center">
                    <BusFront size={17} />
                  </span>
                  Opciones de ruta
                  <span className="bg-accent-tint text-accent-strong rounded-full px-2 py-0.5 text-[11px] font-bold">
                    {routingResults.length}
                  </span>
                </span>
                <ChevronUp size={18} className="text-ink-faint" />
              </button>
            ) : (
              /* Expanded sheet — plays exit animation before switching to the pill */
              <div
                className={`glass absolute left-3 right-3 bottom-(--dock-h) z-1001 rounded-4xl max-h-[58%] flex flex-col select-none overflow-hidden ${
                  isCollapsing ? 'animate-sheet-out' : 'animate-sheet-in'
                }`}
              >
                <div
                  className="flex flex-col items-center pt-2.5 px-4 pb-2 cursor-grab active:cursor-grabbing shrink-0 touch-none"
                  onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
                  onTouchEnd={(e) => {
                    if (touchStartY === null) return
                    if (e.changedTouches[0].clientY - touchStartY > 40) handleMinimizeResults()
                    setTouchStartY(null)
                  }}
                >
                  <div className="w-10 h-1.5 bg-ink/15 rounded-full mb-2" />
                  <div className="flex justify-between items-center w-full">
                    <span className="text-base font-bold text-ink">Opciones de ruta</span>
                    <button
                      onClick={handleMinimizeResults}
                      aria-label="Minimizar resultados"
                      className="w-8 h-8 rounded-full bg-mist text-ink-soft hover:text-ink flex items-center justify-center cursor-pointer active:scale-90 transition-all"
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 min-h-0 px-3 pb-4 pt-1">
                  <RouteResult />
                  {disclaimer}
                </div>
              </div>
            ))}

          {/* Stop detail sheet */}
          {selectedStop && (
            <StopDrawer
              key={selectedStop.id}
              stop={selectedStop}
              activeRoutes={activeRoutes}
              onClose={() => setSelectedStopId(null)}
              variant="drawer"
            />
          )}
        </>
      )}
    </div>
  )
}
