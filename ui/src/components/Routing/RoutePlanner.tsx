import { ArrowLeftRight } from 'lucide-react'
import { useRoutingStore } from '../../store/routingStore'
import { useMapStore } from '../../store/mapStore'
import { useRouteComputation } from './useRouteComputation'
import { LocationAutocomplete } from './LocationAutocomplete'
import type { DBStop } from '../../types'

interface RoutePlannerProps {
  stops: DBStop[]
}

export function RoutePlanner({ stops }: RoutePlannerProps) {
  const {
    origin,
    destination,
    mapClickMode,
    setOrigin,
    setDestination,
    setMapClickMode,
    clearRouting,
  } = useRoutingStore()

  const { setZoom } = useMapStore()

  // Route computation side effect + validation message derivation
  const { errorMsg } = useRouteComputation(stops)

  const handleSwap = () => {
    const tempOrigin = origin
    setOrigin(destination)
    setDestination(tempOrigin)
  }

  return (
    <div className="bg-surface rounded-xl border border-white/8 p-4 flex flex-col gap-3 shadow-card select-none">
      <div className="flex flex-col gap-3">
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
        <div className="flex justify-center -my-2.5">
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Intercambiar origen y destino"
            className="bg-navy-600/50 border border-white/8 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-white/5 active:scale-95 transition-all text-white/60 hover:text-white"
          >
            <ArrowLeftRight size={14} className="rotate-90" />
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
          <div className="bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs rounded-lg p-2.5 flex items-center gap-2 animate-fade-up">
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
