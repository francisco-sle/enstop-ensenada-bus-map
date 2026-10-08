import { useState, type CSSProperties } from 'react'
import { ChevronDown, ChevronUp, Layers } from 'lucide-react'
import { useMapStore } from '../../store/mapStore'
import { useRoutingStore } from '../../store/routingStore'
import { useIsMobile } from '../../hooks/useIsMobile'
import type { RouteDetail } from '../../types'

interface RouteToggleLegendProps {
  routes: RouteDetail[]
  isMinimizedProp?: boolean
  onMinimizeChange?: (minimized: boolean) => void
}

/**
 * Floating legend panel that lets the user show/hide individual routes.
 * On mobile it is minimizable — collapses to a compact pill to free up map space.
 * Rendered as a map overlay (outside MapContainer) so it doesn't interfere
 * with Leaflet's event system. Positioning is owned by the parent.
 */
export function RouteToggleLegend({
  routes,
  isMinimizedProp,
  onMinimizeChange,
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

  const collapse = () => setIsCollapsing(true)

  // ── Collapsed pill ──────────────────────────────────────────
  if (isMinimized) {
    return (
      <button
        type="button"
        onClick={() => setIsMinimized(false)}
        className="glass h-11 rounded-full flex items-center gap-2 pl-3 pr-2.5 active:scale-95 transition-[scale] duration-200 select-none cursor-pointer animate-scale-in origin-bottom-right"
        aria-label="Expandir rutas"
      >
        <Layers size={16} className="text-ink-soft shrink-0" />
        <span className="flex items-center -space-x-1 shrink-0">
          {routes.slice(0, 3).map((r) => (
            <span
              key={r.id}
              className="w-3 h-3 rounded-full ring-2 ring-paper transition-colors duration-300"
              style={{
                backgroundColor: !visibleRouteIds.has(r.id)
                  ? 'var(--color-mist-strong)'
                  : r.brand?.color_hex || r.category?.color_hex || '#3DBFA8',
              }}
            />
          ))}
        </span>
        <span className="text-xs font-semibold text-ink whitespace-nowrap">
          {routes.length} rutas
          {visibleRouteIds.size < routes.length && (
            <span className="text-ink-faint font-medium">
              {' '}
              · {visibleCount} {visibleCount === 1 ? 'visible' : 'visibles'}
            </span>
          )}
        </span>
        <ChevronUp size={14} className="text-ink-faint shrink-0" />
      </button>
    )
  }

  const chipClass = (active: boolean) =>
    `shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 flex items-center gap-1.5 cursor-pointer ${
      active ? 'bg-ink text-paper' : 'bg-mist text-ink-soft hover:text-ink hover:bg-mist-strong'
    }`

  // ── Full panel ────────────────────────────────────────────────────────────
  return (
    <div
      onAnimationEnd={(e) => {
        if (isCollapsing && e.target === e.currentTarget) {
          setIsMinimized(true)
          setIsCollapsing(false)
        }
      }}
      className={`glass rounded-4xl flex flex-col overflow-hidden select-none ${
        isMobile
          ? 'w-full max-h-[45dvh] origin-bottom'
          : 'w-[300px] max-h-[60vh] origin-bottom-right'
      } ${
        isCollapsing
          ? isMobile
            ? 'animate-sheet-out'
            : 'animate-exit'
          : isMobile
            ? 'animate-sheet-in'
            : 'animate-scale-in'
      }`}
    >
      <div className="flex flex-col gap-3 px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-bold text-ink">Rutas</span>
          <div className="flex items-center gap-1">
            <button
              className="text-xs font-semibold text-accent-strong hover:bg-accent-tint px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              onClick={toggleAll}
              title={anyFilteredVisible ? 'Ocultar listadas' : 'Mostrar listadas'}
            >
              {anyFilteredVisible ? 'Ocultar todas' : 'Mostrar todas'}
            </button>
            <button
              className="w-7 h-7 rounded-full bg-mist text-ink-soft hover:text-ink flex items-center justify-center cursor-pointer active:scale-90 transition-all"
              onClick={collapse}
              aria-label="Minimizar panel de rutas"
            >
              <ChevronDown size={15} />
            </button>
          </div>
        </div>

        {brands.length > 0 && (
          <div
            className={
              isMobile
                ? 'flex gap-1.5 overflow-x-auto -mx-4 px-4 [scrollbar-width:none]'
                : 'flex flex-wrap gap-1.5'
            }
          >
            <button
              onClick={() => handleBrandSelect(null)}
              className={chipClass(selectedBrandId === null)}
            >
              Todas
            </button>
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => handleBrandSelect(brand.id)}
                className={chipClass(selectedBrandId === brand.id)}
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

      <ul className="overflow-y-auto flex-1 px-2 pb-2 m-0 list-none">
        {filteredRoutes.map((route, i) => {
          const isHidden = !visibleRouteIds.has(route.id)
          const isSelected = selectedRouteId === route.id
          const color = route.brand?.color_hex || route.category?.color_hex || '#3DBFA8'

          return (
            <li
              key={route.id}
              className="animate-enter stagger"
              style={{ '--i': i } as CSSProperties}
            >
              <button
                role="switch"
                aria-checked={!isHidden}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-2xl text-left cursor-pointer transition-colors duration-200 hover:bg-mist ${
                  isSelected ? 'bg-accent-tint' : ''
                }`}
                onClick={() => toggleRouteVisibility(route.id)}
                title={isHidden ? 'Mostrar ruta' : 'Ocultar ruta'}
              >
                <span
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 transition-[background-color,opacity] duration-300 [text-shadow:0_1px_1px_rgb(0_0_0/0.3)]"
                  style={{ backgroundColor: color, opacity: isHidden ? 0.35 : 1 }}
                >
                  {route.short_name}
                </span>
                <span
                  className={`flex-1 min-w-0 text-[13px] font-medium truncate transition-colors duration-300 ${
                    isHidden ? 'text-ink-faint' : 'text-ink'
                  }`}
                >
                  {route.name.split('—')[1]?.trim() || route.name}
                </span>

                {/* Switch */}
                <span
                  className={`relative w-9 h-5.5 rounded-full shrink-0 transition-colors duration-300 ${
                    isHidden ? 'bg-mist-strong' : 'bg-pacific-500'
                  }`}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-soft transition-transform duration-400"
                    style={{
                      transform: `translateX(${isHidden ? 0 : 14}px)`,
                      transitionTimingFunction: 'var(--ease-spring)',
                    }}
                  />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
