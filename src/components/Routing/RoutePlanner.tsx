import { useState, useEffect, useRef } from 'react'
import { Navigation, MapPin, ArrowLeftRight, Map, X } from 'lucide-react'
import { useRoutingStore } from '../../store/routingStore'
import { useMapStore } from '../../store/mapStore'
import { computeABRoute, getNearbyStops } from './routing'
import { useRoute } from '../../api/useRoute'
import type { DBStop, RouteDetail } from '../../types'

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
    setRoutingResults,
    setMapClickMode,
    clearRouting
  } = useRoutingStore()

  const { setCenter, setZoom } = useMapStore()
  const { data: route1Detail } = useRoute(1)

  const [originInput, setOriginInput] = useState('')
  const [destInput, setDestInput] = useState('')
  const [isOriginFocused, setIsOriginFocused] = useState(false)
  const [isDestFocused, setIsDestFocused] = useState(false)

  const [showOriginDropdown, setShowOriginDropdown] = useState(false)
  const [showDestDropdown, setShowDestDropdown] = useState(false)

  const originRef = useRef<HTMLDivElement>(null)
  const destRef = useRef<HTMLDivElement>(null)

  // Derive active display values
  const displayOrigin = isOriginFocused ? originInput : (origin?.label || '')
  const displayDest = isDestFocused ? destInput : (destination?.label || '')

  // Click outside listener to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginDropdown(false)
        setIsOriginFocused(false)
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setShowDestDropdown(false)
        setIsDestFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-run route computation when both coordinates are set
  useEffect(() => {
    if (!origin || !destination) {
      setRoutingResults([])
      return
    }

    if (origin.lat === destination.lat && origin.lng === destination.lng) {
      setRoutingResults([])
      return
    }

    if (route1Detail) {
      const oNearby = getNearbyStops(origin.lat, origin.lng, stops, 2.0)
      const dNearby = getNearbyStops(destination.lat, destination.lng, stops, 2.0)

      if (oNearby.length === 0 || dNearby.length === 0) {
        setRoutingResults([])
        return
      }

      const results = computeABRoute(
        origin.lat, origin.lng,
        destination.lat, destination.lng,
        oNearby,
        dNearby,
        [route1Detail as unknown as RouteDetail]
      )

      setRoutingResults(results)
    }
  }, [origin, destination, route1Detail, stops, setRoutingResults])

  // Derive error messages dynamically (avoids useEffect setState warnings)
  let errorMsg = ''
  if (origin && destination) {
    if (origin.lat === destination.lat && origin.lng === destination.lng) {
      errorMsg = 'El origen y el destino no pueden ser iguales.'
    } else {
      const oNearby = getNearbyStops(origin.lat, origin.lng, stops, 2.0)
      const dNearby = getNearbyStops(destination.lat, destination.lng, stops, 2.0)

      if (oNearby.length === 0) {
        errorMsg = 'No hay paradas de autobús a menos de 2 km del origen.'
      } else if (dNearby.length === 0) {
        errorMsg = 'No hay paradas de autobús a menos de 2 km del destino.'
      }
    }
  }

  // Filter stops for autocomplete based on typed input
  const filteredOriginStops = stops.filter(stop =>
    stop.name.toLowerCase().includes(originInput.toLowerCase()) ||
    (stop.common_name && stop.common_name.toLowerCase().includes(originInput.toLowerCase()))
  ).slice(0, 5)

  const filteredDestStops = stops.filter(stop =>
    stop.name.toLowerCase().includes(destInput.toLowerCase()) ||
    (stop.common_name && stop.common_name.toLowerCase().includes(destInput.toLowerCase()))
  ).slice(0, 5)

  const handleSwap = () => {
    const tempOrigin = origin
    setOrigin(destination)
    setDestination(tempOrigin)
  }

  const handleClear = () => {
    clearRouting()
    setOriginInput('')
    setDestInput('')
  }

  return (
    <div className="bg-surface rounded-xl border border-white/8 p-4 flex flex-col gap-3 shadow-card select-none">
      <div className="flex flex-col gap-3">
        {/* Origin Selection */}
        <div ref={originRef} className="relative flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-white/50 flex items-center gap-1">
            <MapPin size={12} className="text-teal-400" />
            <span>Punto de Partida (Origen)</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="origin-input"
                type="text"
                placeholder="Escribe parada o selecciona en mapa..."
                value={displayOrigin}
                onChange={(e) => {
                  setOriginInput(e.target.value)
                  setShowOriginDropdown(true)
                  if (!e.target.value) setOrigin(null)
                }}
                onFocus={() => {
                  setIsOriginFocused(true)
                  setOriginInput(origin?.label || '')
                  setShowOriginDropdown(true)
                }}
                className="w-full bg-navy-600/50 border border-white/8 rounded-lg py-2 px-3 pr-8 text-sm text-white placeholder-white/20 focus:outline-none focus:border-teal-400/50"
              />
              {displayOrigin && (
                <button
                  type="button"
                  onClick={() => {
                    setOrigin(null)
                    setOriginInput('')
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/60"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setMapClickMode(mapClickMode === 'origin' ? null : 'origin')
                setZoom(14)
              }}
              title="Seleccionar en el mapa"
              className={`btn px-3 flex items-center gap-1.5 ${
                mapClickMode === 'origin'
                  ? 'bg-teal-400 text-navy-600 border-teal-400 shadow-glow'
                  : 'bg-white/5 border-white/8 hover:bg-white/10'
              }`}
            >
              <Map size={14} />
              <span className="text-xs hidden sm:inline">Mapa</span>
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {showOriginDropdown && originInput && filteredOriginStops.length > 0 && (
            <div className="absolute top-[58px] left-0 right-12 bg-surface-elevated border border-white/8 rounded-lg shadow-card z-50 overflow-hidden">
              {filteredOriginStops.map(stop => (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => {
                    const [lng, lat] = stop.geom.coordinates
                    setOrigin({ lat, lng, label: stop.name })
                    setCenter([lat, lng])
                    setZoom(15)
                    setShowOriginDropdown(false)
                    setIsOriginFocused(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 text-white/90 border-b border-white/4 last:border-b-0 flex flex-col gap-0.5"
                >
                  <span className="font-semibold">{stop.name}</span>
                  {stop.common_name && <span className="text-[10px] text-white/40">{stop.common_name}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

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

        {/* Destination Selection */}
        <div ref={destRef} className="relative flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-white/50 flex items-center gap-1">
            <Navigation size={12} className="text-amber-400" />
            <span>Destino Final</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="dest-input"
                type="text"
                placeholder="Escribe parada o selecciona en mapa..."
                value={displayDest}
                onChange={(e) => {
                  setDestInput(e.target.value)
                  setShowDestDropdown(true)
                  if (!e.target.value) setDestination(null)
                }}
                onFocus={() => {
                  setIsDestFocused(true)
                  setDestInput(destination?.label || '')
                  setShowDestDropdown(true)
                }}
                className="w-full bg-navy-600/50 border border-white/8 rounded-lg py-2 px-3 pr-8 text-sm text-white placeholder-white/20 focus:outline-none focus:border-teal-400/50"
              />
              {displayDest && (
                <button
                  type="button"
                  onClick={() => {
                    setDestination(null)
                    setDestInput('')
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/60"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setMapClickMode(mapClickMode === 'destination' ? null : 'destination')
                setZoom(14)
              }}
              title="Seleccionar en el mapa"
              className={`btn px-3 flex items-center gap-1.5 ${
                mapClickMode === 'destination'
                  ? 'bg-amber-400 text-navy-600 border-amber-400 shadow-glow'
                  : 'bg-white/5 border-white/8 hover:bg-white/10'
              }`}
            >
              <Map size={14} />
              <span className="text-xs hidden sm:inline">Mapa</span>
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {showDestDropdown && destInput && filteredDestStops.length > 0 && (
            <div className="absolute top-[58px] left-0 right-12 bg-surface-elevated border border-white/8 rounded-lg shadow-card z-50 overflow-hidden">
              {filteredDestStops.map(stop => (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => {
                    const [lng, lat] = stop.geom.coordinates
                    setDestination({ lat, lng, label: stop.name })
                    setCenter([lat, lng])
                    setZoom(15)
                    setShowDestDropdown(false)
                    setIsDestFocused(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 text-white/90 border-b border-white/4 last:border-b-0 flex flex-col gap-0.5"
                >
                  <span className="font-semibold">{stop.name}</span>
                  {stop.common_name && <span className="text-[10px] text-white/40">{stop.common_name}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informative Map Picking Hint */}
        {mapClickMode && (
          <div className="bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs rounded-lg p-2.5 flex items-center gap-2 animate-fade-up">
            <span className="animate-pulse">📍</span>
            <span>
              Toca cualquier punto del mapa para definir el{' '}
              <strong className="text-white">{mapClickMode === 'origin' ? 'Origen' : 'Destino'}</strong>.
            </span>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="text-[#E05050] text-xs font-medium flex items-center gap-1.5">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        {(origin || destination) && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClear}
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
