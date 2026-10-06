import { useState, type ReactNode } from 'react'
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  MousePointerClick,
  AlertCircle,
} from 'lucide-react'
import { useRoutingStore } from '../../store/routingStore'
import { useMapStore } from '../../store/mapStore'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useRouteComputation } from './useRouteComputation'
import { LocationAutocomplete } from './LocationAutocomplete'
import { LegalLinks } from '../Legal/LegalModals'
import type { DBStop, RouteDetail } from '../../types'
import { Logo } from '../Logo'

interface RoutePlannerProps {
  stops: DBStop[]
  routes: RouteDetail[]
}

type Location = { lat: number; lng: number; label: string } | null

/** Dark pill notification used for map-pick hints and validation errors. */
function MapToast({
  icon,
  children,
  className = '',
}: {
  icon: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role="status"
      className={`bg-ink/92 backdrop-blur-md text-white shadow-float px-4 py-2.5 rounded-full flex items-center gap-2.5 text-[13px] font-medium pointer-events-none animate-toast-in ${className}`}
    >
      <span className="shrink-0 text-sol-300">{icon}</span>
      <span>{children}</span>
    </div>
  )
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
    routingResults,
  } = useRoutingStore()

  const { setZoom } = useMapStore()
  const isMobile = useIsMobile()

  // Route computation side effect + validation message derivation
  const [isCollapsing, setIsCollapsing] = useState(false)
  // Each swap adds half a turn so the icon always spins the same direction
  const [swapTurns, setSwapTurns] = useState(0)
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
    setSwapTurns((t) => t + 1)
  }

  const mapPickHint = mapClickMode && (
    <>
      Mantén presionado el mapa para fijar el{' '}
      <strong className="font-bold">{mapClickMode === 'origin' ? 'origen' : 'destino'}</strong>
    </>
  )

  /** Origin + destination inputs with the swap control. */
  const tripFields = ({ collapseOnSelect }: { collapseOnSelect: boolean }) => {
    const handleSelect = (setter: (loc: Location) => void) => (val: Location) => {
      setter(val)
      if (val && collapseOnSelect) toggleMinimize(true)
    }
    const handleMapPick = (mode: 'origin' | 'destination') => () => {
      setMapClickMode(mapClickMode === mode ? null : mode)
      if (collapseOnSelect) toggleMinimize(true)
      setZoom(14)
    }

    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <LocationAutocomplete
            role="origin"
            value={origin}
            stops={stops}
            autoFocus={collapseOnSelect && !origin}
            onSelect={handleSelect(setOrigin)}
            onMapPickToggle={handleMapPick('origin')}
            isMapPickActive={mapClickMode === 'origin'}
          />
          <LocationAutocomplete
            role="destination"
            value={destination}
            stops={stops}
            autoFocus={collapseOnSelect && !!origin && !destination}
            onSelect={handleSelect(setDestination)}
            onMapPickToggle={handleMapPick('destination')}
            isMapPickActive={mapClickMode === 'destination'}
          />
        </div>

        <button
          type="button"
          onClick={handleSwap}
          aria-label="Intercambiar origen y destino"
          className="shrink-0 w-9 h-9 rounded-full text-ink-soft hover:text-ink hover:bg-mist flex items-center justify-center cursor-pointer active:scale-90 transition-[color,background-color,scale] duration-200"
        >
          <ArrowUpDown
            size={16}
            strokeWidth={2.2}
            className="transition-transform duration-500"
            style={{
              transform: `rotate(${swapTurns * 180}deg)`,
              transitionTimingFunction: 'var(--ease-spring)',
            }}
          />
        </button>
      </div>
    )
  }

  const clearAction = (
    <div
      className={`grid transition-all duration-500 ${
        origin || destination
          ? 'grid-rows-[1fr] opacity-100 mt-3'
          : 'grid-rows-[0fr] opacity-0 mt-0'
      }`}
      style={{ transitionTimingFunction: 'var(--ease-out-soft)' }}
    >
      <div className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-[11px] text-ink-faint font-medium flex items-center gap-1.5">
            <MousePointerClick size={13} className="shrink-0" />
            Arrastra los pines para ajustar
          </span>
          <button
            type="button"
            onClick={clearRouting}
            className="text-xs font-semibold text-ink-soft hover:text-ink px-3 py-1.5 rounded-full hover:bg-mist transition-colors cursor-pointer"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  )

  if (isMobile && isMinimized) {
    const originLabel = origin?.label.replace(/Punto en Mapa.*/, 'Mi ubicación') || ''
    const destLabel = destination?.label.replace(/Punto en Mapa.*/, 'Destino') || ''
    const hasTrip = origin || destination

    return (
      <div
        className="pointer-events-auto px-3 flex flex-col gap-2 w-full"
        style={{ paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}
      >
        <div
          onClick={() => toggleMinimize(false)}
          className="glass rounded-3xl flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform duration-200 select-none animate-unfold origin-top pl-4 pr-2"
        >
          {hasTrip ? (
            <div className="flex min-w-0 flex-1 flex-col py-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full border-[2.5px] border-pacific-500 shrink-0" />
                <span
                  className={`text-sm truncate ${origin ? 'text-ink font-semibold' : 'text-ink-faint'}`}
                >
                  {origin ? originLabel : 'Elige origen'}
                </span>
              </div>
              <span className="ml-[4px] my-0.5 h-2.5 border-l-2 border-dotted border-ink-faint/50" />
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sol-500 shrink-0" />
                <span
                  className={`text-sm truncate ${destination ? 'text-ink font-semibold' : 'text-ink-faint'}`}
                >
                  {destination ? destLabel : 'Elige destino'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-1 h-13">
              <Search size={18} className="text-ink-soft shrink-0" />
              <span className="text-[15px] text-ink-faint font-medium">¿A dónde vas?</span>
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            {hasTrip && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSwap()
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-mist active:scale-90 transition-all cursor-pointer"
                  aria-label="Intercambiar origen y destino"
                >
                  <ArrowUpDown size={15} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearRouting()
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-mist active:scale-90 transition-all cursor-pointer"
                  aria-label="Limpiar ruta"
                >
                  <X size={16} />
                </button>
              </>
            )}
            <span className="w-9 h-9 rounded-full flex items-center justify-center text-ink-faint">
              <ChevronDown size={18} />
            </span>
          </div>
        </div>

        {mapClickMode && (
          <MapToast icon={<MousePointerClick size={15} />} className="self-center mt-1">
            {mapPickHint}
          </MapToast>
        )}
        {errorMsg && !mapClickMode && (
          <MapToast icon={<AlertCircle size={15} />} className="self-center mt-1">
            {errorMsg}
          </MapToast>
        )}
      </div>
    )
  }

  if (isMobile) {
    // Expanded planner — unfolds from the search bar
    return (
      <div
        className="pointer-events-auto px-3 flex flex-col flex-1 min-h-0 w-full pb-dock"
        style={{ paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}
      >
        <div
          className={`glass rounded-4xl p-4 flex flex-col overflow-y-auto w-full flex-1 origin-top will-change-transform ${
            isCollapsing ? 'animate-fold' : 'animate-unfold'
          }`}
        >
          <div className="flex items-center justify-between mb-5">
            <Logo className="text-2xl text-ink" />
            <button
              type="button"
              onClick={() => toggleMinimize(true)}
              aria-label="Cerrar planificador"
              className="w-9 h-9 rounded-full bg-mist text-ink-soft hover:text-ink flex items-center justify-center cursor-pointer active:scale-90 transition-all"
            >
              <ChevronUp size={18} />
            </button>
          </div>

          <h2 className="text-xl font-bold tracking-tight mb-3 px-1">¿A dónde vas?</h2>

          {tripFields({ collapseOnSelect: true })}
          {clearAction}

          {/* Empty State / Hint Message */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 select-none pb-4 mt-6 min-h-[140px] animate-enter">
            <div className="w-14 h-14 rounded-full bg-pacific-50 text-pacific-500 flex items-center justify-center mb-3">
              <Search size={22} />
            </div>
            <p className="text-sm text-ink-soft leading-relaxed max-w-[240px]">
              {routingResults.length > 0
                ? 'Cierra este panel para ver tus rutas en el mapa.'
                : origin && destination
                  ? 'No se encontraron rutas para estos puntos.'
                  : 'Busca una parada o dirección, o elige un punto en el mapa.'}
            </p>
          </div>

          <div className="shrink-0 flex justify-center pt-4 border-t border-line mt-auto">
            <LegalLinks />
          </div>
        </div>
      </div>
    )
  }

  // Desktop view — rendered inside MapPage's floating panel
  return (
    <div className="flex flex-col select-none">
      {tripFields({ collapseOnSelect: false })}
      {clearAction}

      {mapClickMode && (
        <MapToast
          icon={<MousePointerClick size={15} />}
          className="fixed top-19 left-[calc(50%+194px)] -translate-x-1/2 z-1003"
        >
          {mapPickHint}
        </MapToast>
      )}
      {errorMsg && (
        <MapToast
          icon={<AlertCircle size={15} />}
          className="fixed top-19 left-[calc(50%+194px)] -translate-x-1/2 z-1003"
        >
          {errorMsg}
        </MapToast>
      )}
    </div>
  )
}
