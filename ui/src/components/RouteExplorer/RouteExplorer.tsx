import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { MAX_SHOWN_ROUTES, useMapStore } from '../../store/mapStore'
import { useRouteColors } from '../../hooks/useRouteColors'
import { routeBaseColor } from '../Map/routeColors'
import { routeDisplayName, routeInBounds, routeMatchesQuery } from './routeSearch'
import type { DBBrand, RouteDetail } from '../../types'

/** Groups start expanded only while the whole list stays short. */
const EXPAND_GROUPS_UP_TO = 12
const CAP_NOTE_MS = 2600

interface RouteGroup {
  key: string
  brand: DBBrand | null
  routes: RouteDetail[]
}

function groupByBrand(routes: RouteDetail[]): RouteGroup[] {
  const groups = new Map<string, RouteGroup>()
  for (const route of routes) {
    const key = route.brand ? String(route.brand.id) : 'other'
    if (!groups.has(key)) groups.set(key, { key, brand: route.brand ?? null, routes: [] })
    groups.get(key)!.routes.push(route)
  }
  // Operators with more routes first, "Otras" last
  return [...groups.values()].sort((a, b) => {
    if (!a.brand) return 1
    if (!b.brand) return -1
    return b.routes.length - a.routes.length
  })
}

const sectionTitle =
  'text-[11px] font-bold uppercase tracking-wider text-ink-faint px-2.5 pt-3 pb-1.5'

interface RouteExplorerProps {
  routes: RouteDetail[]
}

/**
 * Find-and-pick list for the whole network: search, the routes currently drawn
 * in color, routes in the visible map area and every route grouped by operator.
 * Picking a route draws it in color on the map (up to MAX_SHOWN_ROUTES).
 * Layout-agnostic — fills its parent, which owns the panel or sheet chrome.
 */
export function RouteExplorer({ routes }: RouteExplorerProps) {
  const { shownRouteIds, toggleShownRoute, setShownRouteIds, viewBounds } = useMapStore()
  const routeColors = useRouteColors(routes)
  const [query, setQuery] = useState('')
  const [showCapNote, setShowCapNote] = useState(false)
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [openGroups, setOpenGroups] = useState<Set<string> | 'all'>(() =>
    routes.length <= EXPAND_GROUPS_UP_TO ? 'all' : new Set(),
  )

  const routesById = useMemo(() => new Map(routes.map((r) => [r.id, r])), [routes])
  const groups = useMemo(() => groupByBrand(routes), [routes])
  const searchResults = useMemo(
    () => (query.trim() ? routes.filter((r) => routeMatchesQuery(r, query)) : null),
    [routes, query],
  )
  const zoneRoutes = useMemo(
    () => (viewBounds ? routes.filter((r) => routeInBounds(r, viewBounds)) : []),
    [routes, viewBounds],
  )
  // Only useful once the user zooms in past the whole city
  const showZone = zoneRoutes.length > 0 && zoneRoutes.length < routes.length

  const shownRoutes = shownRouteIds
    .map((id) => routesById.get(id))
    .filter((r): r is RouteDetail => !!r)

  function handleToggle(id: number) {
    if (toggleShownRoute(id)) return
    setShowCapNote(true)
    if (capTimer.current) clearTimeout(capTimer.current)
    capTimer.current = setTimeout(() => setShowCapNote(false), CAP_NOTE_MS)
  }

  function toggleGroup(key: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev === 'all' ? groups.map((g) => g.key) : prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const renderRow = (route: RouteDetail, i: number) => {
    const isShown = routeColors.has(route.id)
    const color = routeColors.get(route.id) ?? routeBaseColor(route)
    return (
      <li key={route.id} className="animate-enter stagger" style={{ '--i': i } as CSSProperties}>
        <button
          role="checkbox"
          aria-checked={isShown}
          onClick={() => handleToggle(route.id)}
          className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-2xl text-left cursor-pointer transition-colors duration-200 hover:bg-mist ${
            isShown ? 'bg-accent-tint' : ''
          }`}
        >
          <span
            className="min-w-9 h-7 px-1.5 rounded-xl flex items-center justify-center text-[11px] font-extrabold text-white shrink-0 transition-colors duration-300 [text-shadow:0_1px_1px_rgb(0_0_0/0.3)]"
            style={{ backgroundColor: color }}
          >
            {route.short_name}
          </span>
          <span className="flex-1 min-w-0 flex flex-col">
            <span className="text-[13px] font-semibold text-ink truncate">
              {routeDisplayName(route)}
            </span>
            <span className="text-[11px] text-ink-faint font-medium truncate">
              {searchResults && route.brand ? `${route.brand.name} · ` : ''}
              {route.route_stops?.length || 0} paradas
            </span>
          </span>
          <span
            className={`w-5.5 h-5.5 rounded-full shrink-0 flex items-center justify-center transition-[background-color,box-shadow] duration-300 ${
              isShown
                ? 'bg-pacific-500 text-white'
                : 'shadow-[inset_0_0_0_2px_var(--color-mist-strong)]'
            }`}
          >
            {isShown && <Check size={13} strokeWidth={3} className="animate-pop" />}
          </span>
        </button>
      </li>
    )
  }

  return (
    <div className="flex flex-col min-h-0 flex-1 select-none">
      {/* Search */}
      <div className="px-1 pb-2 shrink-0">
        <label className="h-11 rounded-2xl bg-mist flex items-center gap-2.5 pl-3.5 pr-1.5 focus-within:shadow-[inset_0_0_0_2px_var(--color-accent)] transition-shadow">
          <Search size={16} className="text-ink-faint shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por número, colonia u operador"
            aria-label="Buscar rutas"
            className="flex-1 min-w-0 bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Borrar búsqueda"
              className="w-8 h-8 rounded-full text-ink-soft hover:bg-mist-strong flex items-center justify-center cursor-pointer active:scale-90 transition-all"
            >
              <X size={15} />
            </button>
          )}
        </label>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0 pb-2">
        {/* Selected tray */}
        {shownRoutes.length > 0 && (
          <section className="px-1 pb-1">
            <div className="flex items-center justify-between px-1.5 pt-1 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                En el mapa · {shownRoutes.length}/{MAX_SHOWN_ROUTES}
              </span>
              <button
                onClick={() => setShownRouteIds([])}
                className="text-xs font-semibold text-accent-strong hover:bg-accent-tint px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              >
                Limpiar
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 px-1">
              {shownRoutes.map((route) => (
                <button
                  key={route.id}
                  onClick={() => handleToggle(route.id)}
                  aria-label={`Quitar ruta ${route.short_name} del mapa`}
                  className="rounded-full pl-1 pr-2 py-1 flex items-center gap-1.5 bg-mist hover:bg-mist-strong text-xs font-bold text-ink cursor-pointer active:scale-95 transition-[background-color,scale] animate-scale-in"
                >
                  <span
                    className="h-5.5 min-w-7 px-1.5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white [text-shadow:0_1px_1px_rgb(0_0_0/0.3)]"
                    style={{ backgroundColor: routeColors.get(route.id) }}
                  >
                    {route.short_name}
                  </span>
                  <X size={13} className="text-ink-faint" />
                </button>
              ))}
            </div>
          </section>
        )}

        {showCapNote && (
          <p
            role="status"
            className="mx-2 mt-2 rounded-2xl bg-warm-tint text-warm-ink text-xs font-medium px-3 py-2 animate-enter"
          >
            Puedes ver hasta {MAX_SHOWN_ROUTES} rutas a la vez. Quita una para agregar otra.
          </p>
        )}

        {searchResults ? (
          searchResults.length > 0 ? (
            <>
              <h4 className={sectionTitle}>Resultados · {searchResults.length}</h4>
              <ul className="list-none m-0 p-0">{searchResults.map(renderRow)}</ul>
            </>
          ) : (
            <p className="text-sm text-ink-faint text-center px-6 py-8">
              No encontramos rutas para «{query.trim()}».
            </p>
          )
        ) : (
          <>
            {showZone && (
              <>
                <h4 className={sectionTitle}>En esta zona · {zoneRoutes.length}</h4>
                <ul className="list-none m-0 p-0">{zoneRoutes.map(renderRow)}</ul>
              </>
            )}

            <h4 className={sectionTitle}>Todas las rutas · {routes.length}</h4>
            {groups.map((group) => {
              const isOpen = openGroups === 'all' || openGroups.has(group.key)
              const shownInGroup = group.routes.filter((r) => routeColors.has(r.id)).length
              return (
                <section key={group.key}>
                  <button
                    onClick={() => toggleGroup(group.key)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-2xl text-left cursor-pointer hover:bg-mist transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: group.brand?.color_hex ?? 'var(--color-ink-faint)',
                      }}
                    />
                    <span className="flex-1 min-w-0 text-[13px] font-bold text-ink truncate">
                      {group.brand?.name ?? 'Otras'}
                    </span>
                    {shownInGroup > 0 && (
                      <span className="bg-accent-tint text-accent-strong rounded-full px-2 py-0.5 text-[10px] font-bold">
                        {shownInGroup} en mapa
                      </span>
                    )}
                    <span className="text-xs font-semibold text-ink-faint">
                      {group.routes.length}
                    </span>
                    <ChevronDown
                      size={15}
                      className={`text-ink-faint shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <ul className="list-none m-0 p-0 pl-2">{group.routes.map(renderRow)}</ul>
                  )}
                </section>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
