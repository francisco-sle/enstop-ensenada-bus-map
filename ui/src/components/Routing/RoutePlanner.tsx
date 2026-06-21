import { useState, useEffect } from 'react'
import { ArrowLeftRight, ChevronDown, ArrowLeft, MapPin, Navigation } from 'lucide-react'
import { useRoutingStore } from '../../store/routingStore'
import { useMapStore } from '../../store/mapStore'
import { useRouteComputation } from './useRouteComputation'
import { LocationAutocomplete } from './LocationAutocomplete'
import type { DBStop, RouteDetail } from '../../types'
import { Logo } from '../Logo'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile
}

interface RoutePlannerProps {
  stops: DBStop[]
  routes: RouteDetail[]
}

export function RoutePlanner({ stops, routes }: RoutePlannerProps) {
  const {
    origin,
    destination,
    mapClickMode,
    isMinimized,
    setOrigin,
    setDestination,
    setMapClickMode,
    setIsMinimized,
    clearRouting,
  } = useRoutingStore()

  const { setZoom } = useMapStore()
  const isMobile = useIsMobile()

  // Route computation side effect + validation message derivation
  const [isCollapsing, setIsCollapsing] = useState(false)
  const { errorMsg } = useRouteComputation(stops, routes)

  const toggleMinimize = (val: boolean) => {
    if (val === true && !isMinimized && isMobile) {
      setIsCollapsing(true)
      setTimeout(() => {
        setIsMinimized(true)
        setIsCollapsing(false)
      }, 250)
    } else {
      setIsMinimized(val)
    }
  }

  const handleSwap = () => {
    const tempOrigin = origin
    setOrigin(destination)
    setDestination(tempOrigin)
  }

  if (isMobile && isMinimized) {
    const originLabel = origin?.label.replace(/Punto en Mapa.*/, 'Mi ubicación') || ''
    const destLabel = destination?.label.replace(/Punto en Mapa.*/, 'Destino') || ''

    return (
      <div className="pointer-events-auto p-4 flex flex-col gap-3 w-full">
        <div
          onClick={() => toggleMinimize(false)}
          className="bg-surface rounded-xl border border-white/8 p-3.5 shadow-card flex justify-between items-center cursor-pointer hover:bg-surface-elevated active:scale-98 transition-transform duration-150 select-none animate-slide-down"
        >
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Origin field */}
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-pacific-400 shrink-0" />
              <span
                className={`text-sm truncate flex-1 block h-5 leading-5 ${origin ? 'text-pacific-300 font-semibold' : 'text-white/25 font-normal'}`}
              >
                {origin ? originLabel : 'Elige origen...'}
              </span>
            </div>

            {/* Divider — icon column gets dot connector, text column gets a hairline */}
            <div className="flex items-center gap-2 py-1.5">
              {/* Dot connector aligned with icon center (14px icon → 14px wide) */}
              <div className="w-[14px] shrink-0 flex flex-col items-center gap-[3px]">
                <span className="w-[3px] h-[3px] rounded-full bg-white/20" />
                <span className="w-[3px] h-[3px] rounded-full bg-white/12" />
              </div>
              {/* Hairline separator */}
              <div className="divider flex-1" />
            </div>

            {/* Destination field */}
            <div className="flex items-center gap-2">
              <Navigation size={14} className="text-sol-400 shrink-0" />
              <span
                className={`text-sm truncate flex-1 block h-5 leading-5 ${destination ? 'text-sol-300 font-semibold' : 'text-white/25 font-normal'}`}
              >
                {destination ? destLabel : 'Elige destino...'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {(origin || destination) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSwap()
                }}
                className="btn btn-secondary p-1 min-h-0 w-8 h-8 flex items-center justify-center rounded-md text-white/50 hover:text-white"
                title="Intercambiar origen y destino"
              >
                <ArrowLeftRight size={14} className="rotate-90" />
              </button>
            )}
            <div className="p-1 rounded-md text-white/45 hover:text-white transition-colors">
              <ChevronDown size={18} />
            </div>
          </div>
        </div>

        {/* Map-pick hint (Toast for mobile) */}
        {mapClickMode && (
          <div className="bg-bay-900 border border-pacific-500/30 text-white shadow-xl px-4 py-2.5 rounded-full flex items-center justify-center gap-2.5 text-sm animate-fade-up pointer-events-none self-center mx-auto mt-2">
            <span className="animate-pulse">📍</span>
            <span>
              Haz clic derecho (o mantén) para definir{' '}
              <strong className="text-white">
                {mapClickMode === 'origin' ? 'Origen' : 'Destino'}
              </strong>
            </span>
          </div>
        )}

        {/* Validation error (Toast for mobile) */}
        {errorMsg && !mapClickMode && (
          <div className="bg-bay-900 border border-[#E05050]/30 text-white shadow-xl px-4 py-2.5 rounded-full flex items-center justify-center gap-2.5 text-sm animate-fade-up pointer-events-none self-center mx-auto mt-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    )
  }

  if (isMobile) {
    // Full-screen expanded planner for mobile
    return (
      <div className="pointer-events-auto p-4 flex flex-col flex-1 min-h-0 w-full">
        <div
          className={`bg-surface rounded-xl border border-white/8 p-4 shadow-card flex flex-col gap-0 overflow-y-auto w-full flex-1 will-change-transform ${isCollapsing ? 'animate-slide-down-fade' : 'animate-slide-up'}`}
        >
          <div className="flex flex-col flex-1">
            {/* Mini-header: ENSTOP logo on left, borderless back button on right */}
            <div className="flex items-center justify-between mb-4">
              <Logo className="text-2xl text-white" />
              <button
                type="button"
                onClick={() => toggleMinimize(true)}
                aria-label="Cerrar planificador"
                className="p-1.5 rounded-lg cursor-pointer hover:bg-white/8 active:scale-95 transition-all text-white/50 hover:text-white"
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">
              ¿A dónde vas?
            </span>

            {/* Full-width stacked inputs with swap button on the right */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex flex-col gap-2">
                <LocationAutocomplete
                  role="origin"
                  value={origin}
                  stops={stops}
                  autoFocus={!origin}
                  inlineResults
                  onSelect={(val) => {
                    setOrigin(val)
                    if (val) toggleMinimize(true)
                  }}
                  onMapPickToggle={() => {
                    setMapClickMode(mapClickMode === 'origin' ? null : 'origin')
                    toggleMinimize(true)
                    setZoom(14)
                  }}
                  isMapPickActive={mapClickMode === 'origin'}
                />

                <LocationAutocomplete
                  role="destination"
                  value={destination}
                  stops={stops}
                  autoFocus={!!origin && !destination}
                  inlineResults
                  onSelect={(val) => {
                    setDestination(val)
                    if (val) toggleMinimize(true)
                  }}
                  onMapPickToggle={() => {
                    setMapClickMode(mapClickMode === 'destination' ? null : 'destination')
                    toggleMinimize(true)
                    setZoom(14)
                  }}
                  isMapPickActive={mapClickMode === 'destination'}
                />
              </div>

              {/* Swap button */}
              <div className="shrink-0 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleSwap}
                  aria-label="Intercambiar origen y destino"
                  className="btn bg-transparent text-white/50 hover:text-white hover:bg-white/5 rounded-full w-10 h-10 min-h-0 p-0"
                >
                  <ArrowLeftRight size={16} className="rotate-90" />
                </button>
              </div>
            </div>

            {/* Clear action */}
            {(origin || destination) && (
              <button
                type="button"
                onClick={clearRouting}
                className="btn btn-secondary w-full mt-3"
              >
                Limpiar todo
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Desktop view
  return (
    <div className="bg-surface rounded-xl border border-white/8 p-3 md:p-4 flex flex-col gap-2 md:gap-3 shadow-card select-none">
      <div className="flex flex-col gap-2 md:gap-3">
        {/* Origin and Destination with Swap on Right */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex flex-col gap-2 md:gap-3">
            <LocationAutocomplete
              role="origin"
              value={origin}
              stops={stops}
              onSelect={setOrigin}
              onMapPickToggle={() => {
                setMapClickMode(mapClickMode === 'origin' ? null : 'origin')
                setZoom(14)
              }}
              isMapPickActive={mapClickMode === 'origin'}
            />

            <LocationAutocomplete
              role="destination"
              value={destination}
              stops={stops}
              onSelect={setDestination}
              onMapPickToggle={() => {
                setMapClickMode(mapClickMode === 'destination' ? null : 'destination')
                setZoom(14)
              }}
              isMapPickActive={mapClickMode === 'destination'}
            />
          </div>

          {/* Swap Button */}
          <div className="shrink-0 flex items-center justify-center">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Intercambiar origen y destino"
              className="btn bg-transparent text-white/50 hover:text-white hover:bg-white/5 rounded-full w-10 h-10 min-h-0 p-0"
            >
              <ArrowLeftRight size={16} className="rotate-90" />
            </button>
          </div>
        </div>

        {/* Map-pick hint (Toast) */}
        {mapClickMode && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1003] bg-bay-900 border border-pacific-500/30 text-white shadow-xl px-4 py-2 rounded-full flex items-center gap-3 text-sm animate-fade-up pointer-events-none">
            <span className="animate-pulse">📍</span>
            <span>
              Haz clic derecho (o mantén presionado) para definir el{' '}
              <strong className="text-white">
                {mapClickMode === 'origin' ? 'Origen' : 'Destino'}
              </strong>
            </span>
          </div>
        )}

        {/* Validation error (Toast) */}
        {errorMsg && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1003] bg-bay-900 border border-[#E05050]/30 text-white shadow-xl px-4 py-2 rounded-full flex items-center gap-3 text-sm animate-fade-up pointer-events-none">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Clear action */}
        {(origin || destination) && (
          <div className="flex gap-2">
            <button type="button" onClick={clearRouting} className="btn btn-secondary flex-1">
              Limpiar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
