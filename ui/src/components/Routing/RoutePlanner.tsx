import { useState, useEffect } from 'react'
import { ArrowLeftRight, ChevronDown, ArrowLeft, MapPin, Navigation } from 'lucide-react'
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
        className="bg-surface rounded-xl border border-white/8 p-3.5 shadow-card flex justify-between items-center cursor-pointer hover:bg-surface-elevated active:scale-98 transition-transform duration-150 select-none"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Origin field */}
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-pacific-400 shrink-0" />
            <span className={`text-sm truncate flex-1 block h-5 leading-5 ${origin ? 'text-pacific-300 font-semibold' : 'text-white/25 font-normal'}`}>
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
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Destination field */}
          <div className="flex items-center gap-2">
            <Navigation size={14} className="text-sol-400 shrink-0" />
            <span className={`text-sm truncate flex-1 block h-5 leading-5 ${destination ? 'text-sol-300 font-semibold' : 'text-white/25 font-normal'}`}>
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
              className="p-1 rounded-md text-white/35 hover:text-white/70 hover:bg-white/5 transition-colors cursor-pointer"
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
    )
  }

  if (isMobile) {
    // Full-screen expanded planner for mobile
    return (
      <div className="flex flex-col gap-0 overflow-y-auto flex-1">
        {/* Mini-header: title on left, borderless back button on right */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            ¿A dónde vas?
          </span>
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            aria-label="Cerrar planificador"
            className="p-1.5 rounded-lg cursor-pointer hover:bg-white/8 active:scale-95 transition-all text-white/50 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        {/* Full-width stacked inputs with swap button between them */}
        <div className="flex flex-col">
          <LocationAutocomplete
            role="origin"
            value={origin}
            stops={stops}
            autoFocus={!origin}
            inlineResults
            onSelect={(val) => {
              setOrigin(val)
              if (val) setIsMinimized(true)
            }}
            onMapPickToggle={() => {
              setMapClickMode(mapClickMode === 'origin' ? null : 'origin')
              setIsMinimized(true)
              setZoom(14)
            }}
            isMapPickActive={mapClickMode === 'origin'}
          />

          {/* Swap button — aligned to the right (underneath the map buttons) */}
          <div className="flex justify-end my-1">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Intercambiar origen y destino"
              className="bg-bay-700/50 border border-white/8 rounded-full w-11 h-11 flex items-center justify-center cursor-pointer hover:bg-white/8 active:scale-95 transition-all text-white/50 hover:text-white"
            >
              <ArrowLeftRight size={16} className="rotate-90" />
            </button>
          </div>

          <LocationAutocomplete
            role="destination"
            value={destination}
            stops={stops}
            inlineResults
            onSelect={(val) => {
              setDestination(val)
              if (val) setIsMinimized(true)
            }}
            onMapPickToggle={() => {
              setMapClickMode(mapClickMode === 'destination' ? null : 'destination')
              setIsMinimized(true)
              setZoom(14)
            }}
            isMapPickActive={mapClickMode === 'destination'}
          />
        </div>

        {/* Map-pick hint */}
        {mapClickMode && (
          <div className="mt-3 bg-pacific-500/10 border border-pacific-500/20 text-pacific-300 text-xs rounded-lg p-2.5 flex items-center gap-2 animate-fade-up">
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
          <div className="mt-2 text-[#E05050] text-xs font-medium flex items-center gap-1.5">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Clear action */}
        {(origin || destination) && (
          <button
            type="button"
            onClick={clearRouting}
            className="btn text-center bg-white/5 border border-white/8 hover:bg-white/10 mt-3"
          >
            Limpiar todo
          </button>
        )}
      </div>
    )
  }

  // Desktop view
  return (
    <div className="bg-surface rounded-xl border border-white/8 p-3 md:p-4 flex flex-col gap-2 md:gap-3 shadow-card select-none">
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
        <div className="flex justify-center -my-1.5 md:-my-2.5 md:translate-y-2">
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
              Haz clic derecho (o mantén presionado en mapa) para definir el{' '}
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
