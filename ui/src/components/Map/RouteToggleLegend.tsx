import { useMapStore } from '../../store/mapStore'
import type { RouteDetail } from '../../types'

interface RouteToggleLegendProps {
  routes: RouteDetail[]
}

/**
 * Floating legend panel that lets the user show/hide individual routes.
 * Rendered as a map overlay (outside MapContainer) so it doesn't interfere
 * with Leaflet's event system.
 */
export function RouteToggleLegend({ routes }: RouteToggleLegendProps) {
  const { hiddenRouteIds, toggleRouteVisibility, selectedRouteId, setSelectedRouteId } = useMapStore()

  if (routes.length === 0) return null

  const allVisible = hiddenRouteIds.size === 0
  const someHidden = hiddenRouteIds.size > 0 && hiddenRouteIds.size < routes.length

  function toggleAll() {
    if (allVisible || someHidden) {
      // Hide all
      routes.forEach(r => { if (!hiddenRouteIds.has(r.id)) toggleRouteVisibility(r.id) })
    } else {
      // Show all
      routes.forEach(r => { if (hiddenRouteIds.has(r.id)) toggleRouteVisibility(r.id) })
    }
  }

  return (
    <div className="route-toggle-legend">
      <div className="route-toggle-legend__header">
        <span className="route-toggle-legend__title">Rutas</span>
        <button
          className="route-toggle-legend__all-btn"
          onClick={toggleAll}
          title={allVisible || someHidden ? 'Ocultar todas' : 'Mostrar todas'}
        >
          {allVisible || someHidden ? 'Ocultar' : 'Mostrar'}
        </button>
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
              {/* Color swatch + route name — clicking selects the route on the map */}
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

              {/* Eye toggle */}
              <button
                className="route-toggle-legend__eye-btn"
                onClick={() => toggleRouteVisibility(route.id)}
                title={isHidden ? 'Mostrar ruta' : 'Ocultar ruta'}
                aria-pressed={!isHidden}
              >
                {isHidden ? (
                  // Eye-off icon
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  // Eye icon
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
