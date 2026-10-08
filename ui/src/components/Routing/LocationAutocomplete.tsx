import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { MapPin, Map as MapIcon, X, Loader2, BusFront } from 'lucide-react'
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
  /**
   * When true, results are rendered as a static list below the input (not
   * position:absolute). Use this inside the mobile full-screen overlay so
   * results fill the scrollable panel rather than overflowing it.
   */
  inlineResults?: boolean
  /** When true, auto-focuses the input on mount (used in overlay mode). */
  autoFocus?: boolean
}

/**
 * A combined stop-name search + Photon geocoder autocomplete input.
 * Renders a text input, an optional clear button, a map-pick toggle button,
 * and a results list (floating dropdown or inline depending on `inlineResults`).
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
  inlineResults = false,
  autoFocus = false,
}: LocationAutocompleteProps) {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevValueRef = useRef(value)
  const { setCenter, setZoom } = useMapStore()

  const { results: photonResults, isLoading: photonLoading } = usePhotonGeocoder(
    isFocused ? input : '',
  )

  // Sync internal input state when value is changed externally (e.g. Limpiar or Swap buttons)
  useEffect(() => {
    if (prevValueRef.current !== null && value === null) {
      setInput('')
    } else if (value !== null && value.label !== prevValueRef.current?.label) {
      setInput(value.label)
    }
    prevValueRef.current = value
  }, [value])

  // Show committed label when blurred; if no value committed yet, keep whatever the user typed
  const displayValue = isFocused ? input : (value?.label ?? input)

  const isOrigin = role === 'origin'
  const accentClass = isOrigin ? 'text-accent' : 'text-warm'
  const mapActiveClass = isOrigin ? 'bg-pacific-500 text-white' : 'bg-sol-500 text-white'

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

  // Delayed autofocus to prevent animation glitches on mobile
  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  const filteredStops = stops
    .filter(
      (stop) =>
        stop.name.toLowerCase().includes(input.toLowerCase()) ||
        (stop.common_name && stop.common_name.toLowerCase().includes(input.toLowerCase())),
    )
    .slice(0, 5)

  const hasStops = filteredStops.length > 0
  const hasAddresses = photonResults.length > 0
  const showEmpty = isFocused && input && !photonLoading && !hasStops && !hasAddresses
  const showResults =
    showDropdown && input && (hasStops || hasAddresses || photonLoading || !!showEmpty)

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

  const sectionLabel =
    'px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-faint'
  const itemClass =
    'w-full text-left px-3 py-2.5 rounded-xl text-[13px] text-ink hover:bg-mist active:bg-mist-strong flex items-center gap-3 transition-colors cursor-pointer animate-enter stagger'

  const resultItems = (
    <>
      {hasStops && (
        <>
          <div className={sectionLabel}>Paradas</div>
          {filteredStops.map((stop, i) => (
            <button
              key={stop.id}
              type="button"
              onClick={() => handleStopSelect(stop)}
              className={itemClass}
              style={{ '--i': i } as CSSProperties}
            >
              <span className="w-8 h-8 rounded-full bg-mist flex items-center justify-center shrink-0">
                <BusFront size={15} className={accentClass} />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="font-semibold truncate">{stop.name}</span>
                {stop.common_name && (
                  <span className="text-[11px] text-ink-faint truncate">{stop.common_name}</span>
                )}
              </span>
            </button>
          ))}
        </>
      )}
      {(hasAddresses || photonLoading) && (
        <>
          <div className={`${sectionLabel} flex items-center gap-1.5`}>
            Direcciones
            {photonLoading && <Loader2 size={10} className="animate-spin" />}
          </div>
          {photonResults.map((result, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAddressSelect(result)}
              className={itemClass}
              style={{ '--i': i } as CSSProperties}
            >
              <span className="w-8 h-8 rounded-full bg-mist flex items-center justify-center shrink-0">
                <MapPin size={15} className="text-ink-soft" />
              </span>
              <span className="text-left min-w-0 line-clamp-2">{result.label}</span>
            </button>
          ))}
        </>
      )}
      {showEmpty && (
        <div className="px-3 py-4 text-xs text-ink-faint text-center">
          No se encontraron resultados
        </div>
      )}
    </>
  )

  return (
    <div ref={containerRef} className="relative flex flex-col">
      <div className="relative">
        {/* Leading marker — mirrors the A/B pins on the map */}
        <div className="absolute left-3.5 top-0 bottom-0 flex items-center pointer-events-none">
          {isOrigin ? (
            <span className="w-3.5 h-3.5 rounded-full border-[3.5px] border-pacific-500 bg-paper" />
          ) : (
            <MapPin size={16} strokeWidth={2.5} className={accentClass} />
          )}
        </div>
        <input
          ref={inputRef}
          id={`${role}-input`}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          placeholder={isOrigin ? '¿Desde dónde sales?' : '¿A dónde vas?'}
          value={displayValue}
          onChange={(e) => {
            setInput(e.target.value)
            setShowDropdown(true)
            if (!e.target.value) onSelect(null)
          }}
          onFocus={() => {
            setIsFocused(true)
            // Preserve typed text if there is no committed value yet
            setInput(value?.label ?? input)
            setShowDropdown(true)
          }}
          className="w-full h-12 rounded-2xl pl-10 pr-20 text-sm font-medium text-ink placeholder:text-ink-faint placeholder:font-normal bg-mist border border-transparent outline-none transition-[background-color,box-shadow,border-color] duration-300 hover:bg-mist-strong focus:bg-paper focus:border-line focus:shadow-soft focus-visible:outline-none"
        />
        <div className="absolute right-1.5 top-0 bottom-0 flex items-center gap-0.5">
          {displayValue && (
            <button
              type="button"
              aria-label="Borrar"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(null)
                setInput('')
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-ink-faint hover:text-ink hover:bg-mist-strong cursor-pointer transition-colors animate-scale-in"
            >
              <X size={14} />
            </button>
          )}
          {/* Map-pick toggle */}
          <button
            type="button"
            onClick={onMapPickToggle}
            title="Seleccionar en el mapa"
            aria-label="Seleccionar en el mapa"
            aria-pressed={isMapPickActive}
            className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-90 ${
              isMapPickActive ? mapActiveClass : 'text-ink-soft hover:text-ink hover:bg-mist-strong'
            }`}
          >
            <MapIcon size={16} />
          </button>
        </div>

        {/* Floating dropdown — rendered as absolute overlay in default mode */}
        {!inlineResults && showResults && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-paper rounded-3xl shadow-float p-1.5 z-50 max-h-80 overflow-y-auto origin-top animate-scale-in">
            {resultItems}
          </div>
        )}
      </div>

      {/* Inline results — rendered as static flow inside overlay */}
      {inlineResults && showResults && (
        <div className="flex flex-col mt-2 rounded-3xl bg-paper shadow-soft p-1.5">
          {resultItems}
        </div>
      )}
    </div>
  )
}
