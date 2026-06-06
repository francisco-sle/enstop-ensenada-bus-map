import { useState, useEffect, useRef } from 'react'
import { Navigation, MapPin, Map, X, Loader2 } from 'lucide-react'
import { usePhotonGeocoder } from '../../api/usePhotonGeocoder'
import { useMapStore } from '../../store/mapStore'
import type { DBStop } from '../../types'

export type LocationRole = 'origin' | 'destination'

interface LocationAutocompleteProps {
  role: LocationRole
  /** Current committed location — drives the display value when unfocused. */
  value: { lat: number; lng: number; label: string } | null
  /** All stops available for name-based filtering. */
  stops: DBStop[]
  /** Called when the user selects a stop or geocoded address. */
  onSelect: (loc: { lat: number; lng: number; label: string } | null) => void
  /** Called when the map-pick button is toggled. */
  onMapPickToggle: () => void
  /** Whether map-pick mode is currently active for this field. */
  isMapPickActive: boolean
}

/**
 * A combined stop-name search + Photon geocoder autocomplete input.
 * Renders a text input, an optional clear button, a map-pick toggle button,
 * and a dropdown listing matching stops and/or geocoded addresses.
 *
 * Manages its own focus/input state internally; the parent only needs to
 * handle `onSelect` and `onMapPickToggle` callbacks.
 *
 * @example
 * <LocationAutocomplete
 *   role="origin"
 *   value={origin}
 *   stops={allStops}
 *   onSelect={setOrigin}
 *   onMapPickToggle={() => setMapClickMode('origin')}
 *   isMapPickActive={mapClickMode === 'origin'}
 * />
 */
export function LocationAutocomplete({
  role,
  value,
  stops,
  onSelect,
  onMapPickToggle,
  isMapPickActive,
}: LocationAutocompleteProps) {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { setCenter, setZoom } = useMapStore()

  const { results: photonResults, isLoading: photonLoading } = usePhotonGeocoder(
    isFocused ? input : ''
  )

  const displayValue = isFocused ? input : (value?.label || '')

  const isOrigin = role === 'origin'
  const accentClass = isOrigin ? 'text-teal-400' : 'text-amber-400'
  const mapActiveClass = isOrigin
    ? 'bg-teal-400 text-navy-600 border-teal-400 shadow-glow'
    : 'bg-amber-400 text-navy-600 border-amber-400 shadow-glow'

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const filteredStops = stops
    .filter(stop =>
      stop.name.toLowerCase().includes(input.toLowerCase()) ||
      (stop.common_name && stop.common_name.toLowerCase().includes(input.toLowerCase()))
    )
    .slice(0, 5)

  const hasStops = filteredStops.length > 0
  const hasAddresses = photonResults.length > 0
  const showEmpty = isFocused && input && !photonLoading && !hasStops && !hasAddresses

  const handleStopSelect = (stop: DBStop) => {
    const [lng, lat] = stop.geom.coordinates
    onSelect({ lat, lng, label: stop.name })
    setCenter([lat, lng])
    setZoom(15)
    setShowDropdown(false)
    setIsFocused(false)
  }

  const handleAddressSelect = (result: { lat: number; lng: number; label: string }) => {
    onSelect(result)
    setCenter([result.lat, result.lng])
    setZoom(15)
    setShowDropdown(false)
    setIsFocused(false)
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label className={`text-[11px] font-semibold text-white/50 flex items-center gap-1`}>
        {isOrigin
          ? <MapPin size={12} className={accentClass} />
          : <Navigation size={12} className={accentClass} />
        }
        <span>{isOrigin ? 'Punto de Partida (Origen)' : 'Destino Final'}</span>
      </label>

      <div className="flex gap-2">
        {/* Text input + clear button */}
        <div className="relative flex-1">
          <input
            id={`${role}-input`}
            type="text"
            placeholder="Escribe parada o selecciona en mapa..."
            value={displayValue}
            onChange={(e) => {
              setInput(e.target.value)
              setShowDropdown(true)
              if (!e.target.value) onSelect(null)
            }}
            onFocus={() => {
              setIsFocused(true)
              setInput(value?.label || '')
              setShowDropdown(true)
            }}
            className="w-full bg-navy-600/50 border border-white/8 rounded-lg py-2 px-3 pr-8 text-sm text-white placeholder-white/20 focus:outline-hidden focus:border-teal-400/50"
          />
          {displayValue && (
            <button
              type="button"
              onClick={() => { onSelect(null); setInput('') }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/60"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Map-pick toggle */}
        <button
          type="button"
          onClick={onMapPickToggle}
          title="Seleccionar en el mapa"
          className={`btn px-3 flex items-center gap-1.5 ${
            isMapPickActive ? mapActiveClass : 'bg-white/5 border-white/8 hover:bg-white/10'
          }`}
        >
          <Map size={14} />
          <span className="text-xs hidden sm:inline">Mapa</span>
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && input && (!(!hasStops && !hasAddresses && !photonLoading)) && (
        <div className="absolute top-[58px] left-0 right-12 bg-surface-elevated border border-white/8 rounded-lg shadow-card z-50 overflow-hidden">
          {/* Bus stops section */}
          {hasStops && (
            <>
              <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white/25">
                Paradas de Bus
              </div>
              {filteredStops.map(stop => (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => handleStopSelect(stop)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 text-white/90 border-b border-white/4 last:border-b-0 flex items-center gap-2"
                >
                  <MapPin size={10} className={`${accentClass} shrink-0`} />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{stop.name}</span>
                    {stop.common_name && (
                      <span className="text-[10px] text-white/40">{stop.common_name}</span>
                    )}
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Photon addresses section */}
          {(hasAddresses || photonLoading) && (
            <>
              <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-white/25 flex items-center gap-1.5 border-t border-white/5">
                Direcciones
                {photonLoading && <Loader2 size={9} className="animate-spin text-white/30" />}
              </div>
              {photonResults.map((result, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddressSelect(result)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 text-white/90 border-b border-white/4 last:border-b-0 flex items-center gap-2"
                >
                  <Navigation size={10} className="text-white/40 shrink-0" />
                  <span className="truncate">{result.label}</span>
                </button>
              ))}
            </>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="px-3 py-3 text-xs text-white/30 text-center">
              No se encontraron resultados
            </div>
          )}
        </div>
      )}
    </div>
  )
}
