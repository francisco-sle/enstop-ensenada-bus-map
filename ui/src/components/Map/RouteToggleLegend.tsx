import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useMapStore } from '../../store/mapStore'
import type { RouteDetail } from '../../types'

interface RouteToggleLegendProps {
  routes: RouteDetail[]
  isMinimizedProp?: boolean
  onMinimizeChange?: (minimized: boolean) => void
  pushedUp?: boolean
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

/**
 * Floating legend panel that lets the user show/hide individual routes.
 * On mobile it is minimizable — collapses to a compact pill to free up map space.
 * Rendered as a map overlay (outside MapContainer) so it doesn't interfere
 * with Leaflet's event system.
 */
export function RouteToggleLegend({ routes, isMinimizedProp, onMinimizeChange, pushedUp }: RouteToggleLegendProps) {
  const { hiddenRouteIds, toggleRouteVisibility, selectedRouteId, setSelectedRouteId } = useMapStore()
  const isMobile = useIsMobile()
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile)
  const [isMinimizedInternal, setIsMinimizedInternal] = useState(isMobile)
  const [isCollapsing, setIsCollapsing] = useState(false)

  const isMinimized = isMinimizedProp !== undefined ? isMinimizedProp : isMinimizedInternal
  const setIsMinimized = (val: boolean) => {
    if (onMinimizeChange) {
      onMinimizeChange(val)
    } else {
      setIsMinimizedInternal(val)
    }
  }

  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile)
    if (isMinimizedProp === undefined) {
      setIsMinimizedInternal(isMobile)
    }
  }

  if (routes.length === 0) return null

  const allVisible = hiddenRouteIds.size === 0
  const someHidden = hiddenRouteIds.size > 0 && hiddenRouteIds.size < routes.length
  const visibleCount = routes.length - hiddenRouteIds.size

  function toggleAll() {
    if (allVisible || someHidden) {
      routes.forEach(r => { if (!hiddenRouteIds.has(r.id)) toggleRouteVisibility(r.id) })
    } else {
      routes.forEach(r => { if (hiddenRouteIds.has(r.id)) toggleRouteVisibility(r.id) })
    }
  }

  // ── Collapsed pill (mobile only) ──────────────────────────────────────────
  if (isMobile && isMinimized) {
    return (
      <button
        type="button"
        onClick={() => setIsMinimized(false)}
        className="h-11 bg-surface border border-white/8 rounded-xl shadow-card flex items-center gap-2 px-3 hover:bg-surface-elevated active:scale-95 transition-transform duration-150 select-none cursor-pointer"
        aria-label="Expandir rutas"
      >
        {/* Swatches preview */}
        <div className="flex items-center gap-1 shrink-0">
          {routes.slice(0, 3).map(r => (
            <span
              key={r.id}
              className="w-2 h-2 rounded-full border border-white/15"
              style={{ backgroundColor: hiddenRouteIds.has(r.id) ? '#555' : (r.category?.color_hex || '#3DBFA8') }}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-white/70 whitespace-nowrap">
          {routes.length} rutas
          {hiddenRouteIds.size > 0 && (
            <span className="text-pacific-400"> ({visibleCount})</span>
          )}
        </span>
        <ChevronDown size={14} className="text-white/45 shrink-0" />
      </button>
    )
  }


  // ── Full panel ────────────────────────────────────────────────────────────
  return (
    <div className={`route-toggle-legend${isMobile ? ' route-toggle-legend--mobile-expanded' : ''}${isCollapsing ? ' route-toggle-legend--collapsing' : ''}${pushedUp ? ' route-toggle-legend--pushed-up' : ''}`}>
      <div className="route-toggle-legend__header">
        <span className="route-toggle-legend__title">Rutas</span>
        <div className="route-toggle-legend__header-actions">
          <button
            className="route-toggle-legend__all-btn"
            onClick={toggleAll}
            title={allVisible || someHidden ? 'Ocultar todas' : 'Mostrar todas'}
          >
            {allVisible || someHidden ? 'Ocultar' : 'Mostrar'}
          </button>
          {isMobile && (
            <button
              className="route-toggle-legend__collapse-btn"
              onClick={() => {
                setIsCollapsing(true)
                setTimeout(() => {
                  setIsMinimized(true)
                  setIsCollapsing(false)
                }, 250)
              }}
              aria-label="Minimizar panel de rutas"
            >
              <ChevronDown size={14} />
            </button>
          )}
        </div>
      </div>

      <ul className="route-toggle-legend__list">
        {routes.map(route => {
          const isHidden = hiddenRouteIds.has(route.id)
          const isSelected = selectedRouteId === route.id
          const color = route.category?.color_hex || '#3DBFA8'

          return (
            <li
              key={route.id}
              className={[
                'route-toggle-legend__item',
                isHidden ? 'route-toggle-legend__item--hidden' : '',
                isSelected ? 'route-toggle-legend__item--selected' : '',
              ].join(' ').trim()}
            >
              <button
                className="route-toggle-legend__label-btn"
                onClick={() => setSelectedRouteId(isSelected ? null : route.id)}
                title={isSelected ? 'Deseleccionar ruta' : 'Seleccionar ruta'}
              >
                <span
                  className="route-toggle-legend__swatch"
                  style={{ backgroundColor: isHidden ? '#555' : color }}
                />
                <span className="route-toggle-legend__name">
                  {route.short_name || route.name}
                </span>
              </button>

              <button
                className="route-toggle-legend__eye-btn"
                onClick={() => toggleRouteVisibility(route.id)}
                title={isHidden ? 'Mostrar ruta' : 'Ocultar ruta'}
                aria-pressed={!isHidden}
              >
                {isHidden ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
