import { useState, useEffect } from 'react'
import { ArrowLeftRight, ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { useRoutingStore } from '../../store/routingStore'
import { useMapStore } from '../../store/mapStore'
import { useRouteComputation } from './useRouteComputation'
import { LocationAutocomplete } from './LocationAutocomplete'
import type { DBStop } from '../../types'

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
}

export function RoutePlanner({ stops }: RoutePlannerProps) {
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
  const { errorMsg } = useRouteComputation(stops)

  const handleSwap = () => {
    const tempOrigin = origin
    setOrigin(destination)
    setDestination(tempOrigin)
  }

  if (isMobile && isMinimized) {
    const originLabel = origin?.label.replace(/Punto en Mapa.*/, 'Mi ubicación') || ''
    const destLabel = destination?.label.replace(/Punto en Mapa.*/, 'Destino') || ''

    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="bg-surface rounded-xl border border-white/8 p-3.5 shadow-card flex items-center justify-between cursor-pointer hover:bg-surface-elevated active:scale-[0.99] transition-all select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Search size={16} className="text-pacific-400 shrink-0" />
          <div className="text-xs text-white/90 truncate font-semibold">
            {origin && destination ? (
              <span className="flex items-center gap-1.5 truncate">
                <span className="truncate max-w-[110px] text-pacific-300">{originLabel}</span>
                <span className="text-white/30">➔</span>
                <span className="truncate max-w-[110px] text-sol-300">{destLabel}</span>
              </span>
            ) : origin ? (
              <span>De: <span className="text-pacific-300">{originLabel}</span></span>
            ) : destination ? (
              <span>A: <span className="text-sol-300">{destLabel}</span></span>
            ) : (
              <span className="text-white/40 font-medium">¿A dónde vas en Ensenada?</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {(origin || destination) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                clearRouting()
              }}
              className="p-1 rounded-md text-white/35 hover:text-white/70 hover:bg-white/5 transition-colors cursor-pointer"
              title="Limpiar"
            >
              <X size={14} />
            </button>
          )}
          <div className="p-1 rounded-md text-white/45 hover:text-white transition-colors">
            <ChevronDown size={18} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl border border-white/8 p-3 md:p-4 flex flex-col gap-2 md:gap-3 shadow-card select-none">
      {isMobile && (
        <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-0.5">
          <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
            <Search size={12} className="text-pacific-400" />
            Planificador de Ruta
          </span>
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1 -mr-1 rounded-md text-white/45 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Minimizar planificador"
          >
            <ChevronUp size={18} />
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2 md:gap-3">
        {/* Origin */}
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

        {/* Swap Button */}
        <div className="flex justify-center -my-1.5 md:-my-2.5">
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Intercambiar origen y destino"
            className="bg-bay-700/50 border border-white/8 rounded-full w-8 h-8 md:w-11 md:h-11 flex items-center justify-center cursor-pointer hover:bg-white/5 active:scale-95 transition-all text-white/60 hover:text-white"
          >
            <ArrowLeftRight size={isMobile ? 14 : 16} className="rotate-90" />
          </button>
        </div>

        {/* Destination */}
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

        {/* Map-pick hint */}
        {mapClickMode && (
          <div className="bg-pacific-500/10 border border-pacific-500/20 text-pacific-300 text-xs rounded-lg p-2.5 flex items-center gap-2 animate-fade-up">
            <span className="animate-pulse">📍</span>
            <span>
              Haz clic derecho (o mantén presionado en móvil) en el mapa para definir el{' '}
              <strong className="text-white">
                {mapClickMode === 'origin' ? 'Origen' : 'Destino'}
              </strong>.
            </span>
          </div>
        )}

        {/* Validation error */}
        {errorMsg && (
          <div className="text-[#E05050] text-xs font-medium flex items-center gap-1.5">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Clear action */}
        {(origin || destination) && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearRouting}
              className="btn flex-1 text-center bg-white/5 border border-white/8 hover:bg-white/10"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
