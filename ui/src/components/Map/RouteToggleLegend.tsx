import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useMapStore } from '../../store/mapStore'
import { useRoutingStore } from '../../store/routingStore'
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
export function RouteToggleLegend({
  routes,
  isMinimizedProp,
  onMinimizeChange,
  pushedUp,
}: RouteToggleLegendProps) {
  const { visibleRouteIds, toggleRouteVisibility, setVisibleRouteIds, selectedRouteId } =
    useMapStore()
  const { routingResults, selectedResultIndex, origin, destination } = useRoutingStore()
  const isMobile = useIsMobile()
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile)
  const [isMinimizedInternal, setIsMinimizedInternal] = useState(isMobile)
  const [isCollapsing, setIsCollapsing] = useState(false)
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)

  const isRoutingActive = origin !== null || destination !== null || routingResults.length > 0
  const [prevRoutingActive, setPrevRoutingActive] = useState(isRoutingActive)

  // Derive state during render instead of useEffect (React recommended pattern to avoid cascading renders)
  if (isRoutingActive !== prevRoutingActive) {
    setPrevRoutingActive(isRoutingActive)
    if (selectedBrandId !== null) {
      setSelectedBrandId(null)
    }
  }

  if (routingResults.length > 0 && selectedResultIndex !== null) {
    // If we just selected a result, force selectedBrandId to null
    // We can't easily track prevSelectedResultIndex without another state/ref,
    // but doing it here if it's not null is safe because it will immediately trigger a re-render and then be null.
    if (selectedBrandId !== null) {
      setSelectedBrandId(null)
    }
  }

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

  const brands = Array.from(
    new Map(routes.filter((r) => r.brand).map((r) => [r.brand!.id, r.brand!])).values(),
  )

  const filteredRoutes = selectedBrandId
    ? routes.filter((r) => r.brand?.id === selectedBrandId)
    : routes

  const anyFilteredVisible = filteredRoutes.some((r) => visibleRouteIds.has(r.id))
  const visibleCount = visibleRouteIds.size

  function toggleAll() {
    const next = new Set(visibleRouteIds)
    if (anyFilteredVisible) {
      filteredRoutes.forEach((r) => next.delete(r.id))
    } else {
      filteredRoutes.forEach((r) => next.add(r.id))
    }
    setVisibleRouteIds(next)
  }

  function handleBrandSelect(brandId: number | null) {
    setSelectedBrandId(brandId)
  }

  // ── Collapsed pill ──────────────────────────────────────────
  if (isMinimized) {
    return (
      <button
        type="button"
        onClick={() => setIsMinimized(false)}
        className={`h-11 bg-surface border border-white/8 rounded-lg shadow-card flex items-center gap-2 px-3 hover:bg-surface-elevated active:scale-95 transition-transform duration-150 select-none cursor-pointer ${
          !isMobile ? 'absolute bottom-12 right-3 z-[1000] animate-fade-in' : ''
        }`}
        aria-label="Expandir rutas"
      >
        {/* Swatches preview */}
        <div className="flex items-center gap-1 shrink-0">
          {routes.slice(0, 3).map((r) => (
            <span
              key={r.id}
              className="w-2 h-2 rounded-full border border-white/15"
              style={{
                backgroundColor: !visibleRouteIds.has(r.id)
                  ? '#555'
                  : r.brand?.color_hex || r.category?.color_hex || '#3DBFA8',
              }}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-white/70 whitespace-nowrap">
          {routes.length} rutas
          {visibleRouteIds.size < routes.length && (
            <span className="text-pacific-400"> ({visibleCount})</span>
          )}
        </span>
        <ChevronDown size={14} className="text-white/45 shrink-0" />
      </button>
    )
  }

  // ── Full panel ────────────────────────────────────────────────────────────
  return (
    <div
      className={`route-toggle-legend${isMobile ? ' route-toggle-legend--mobile-expanded' : ''}${isCollapsing ? ' route-toggle-legend--collapsing' : ''}${pushedUp ? ' route-toggle-legend--pushed-up' : ''}`}
    >
      <div className="route-toggle-legend__header flex-col items-stretch gap-3 pb-3">
        <div className="flex items-center justify-between w-full">
          <span className="route-toggle-legend__title">Rutas</span>
          <div className="route-toggle-legend__header-actions">
            <button
              className="route-toggle-legend__all-btn"
              onClick={toggleAll}
              title={anyFilteredVisible ? 'Ocultar listadas' : 'Mostrar listadas'}
            >
              {anyFilteredVisible ? 'Ocultar' : 'Mostrar'}
            </button>
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
          </div>
        </div>

        {brands.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-1 -mx-1 px-1">
            <button
              onClick={() => handleBrandSelect(null)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                selectedBrandId === null
                  ? 'bg-white text-bay-950 border-white'
                  : 'bg-surface border-white/10 text-white/70 hover:bg-surface-elevated hover:text-white'
              }`}
            >
              Todas
            </button>
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => handleBrandSelect(brand.id)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors flex items-center gap-1.5 ${
                  selectedBrandId === brand.id
                    ? 'bg-white text-bay-950 border-white'
                    : 'bg-surface border-white/10 text-white/70 hover:bg-surface-elevated hover:text-white'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: brand.color_hex }}
                />
                {brand.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <ul className="route-toggle-legend__list">
        {filteredRoutes.map((route) => {
          const isHidden = !visibleRouteIds.has(route.id)
          const isSelected = selectedRouteId === route.id
          const color = route.brand?.color_hex || route.category?.color_hex || '#3DBFA8'

          return (
            <li
              key={route.id}
              className={[
                'route-toggle-legend__item',
                isHidden ? 'route-toggle-legend__item--hidden' : '',
                isSelected ? 'route-toggle-legend__item--selected' : '',
              ]
                .join(' ')
                .trim()}
            >
              <button
                className="route-toggle-legend__label-btn w-full"
                onClick={() => toggleRouteVisibility(route.id)}
                title={isHidden ? 'Mostrar ruta' : 'Ocultar ruta'}
              >
                <span
                  className="route-toggle-legend__swatch"
                  style={{ backgroundColor: isHidden ? '#555' : color }}
                />
                <span className="route-toggle-legend__name">{route.short_name || route.name}</span>

                <span className="ml-auto flex shrink-0 text-white/50">
                  {isHidden ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
