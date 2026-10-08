import { useState } from 'react'
import { ChevronDown, ChevronUp, Layers } from 'lucide-react'
import { useRouteColors } from '../../hooks/useRouteColors'
import { RouteExplorer } from './RouteExplorer'
import type { RouteDetail } from '../../types'

interface RouteExplorerPillProps {
  routes: RouteDetail[]
  onExpand: () => void
}

/** Compact mobile entry point — shows how many routes are drawn in color. */
export function RouteExplorerPill({ routes, onExpand }: RouteExplorerPillProps) {
  const routeColors = useRouteColors(routes)
  const shownCount = routeColors.size

  return (
    <button
      type="button"
      onClick={onExpand}
      className="glass h-11 rounded-full flex items-center gap-2 pl-3 pr-2.5 active:scale-95 transition-[scale] duration-200 select-none cursor-pointer animate-scale-in origin-bottom-right"
      aria-label="Explorar rutas"
    >
      <Layers size={16} className="text-ink-soft shrink-0" />
      {shownCount > 0 && (
        <span className="flex items-center -space-x-1 shrink-0">
          {[...routeColors].map(([id, color]) => (
            <span
              key={id}
              className="w-3 h-3 rounded-full ring-2 ring-paper"
              style={{ backgroundColor: color }}
            />
          ))}
        </span>
      )}
      <span className="text-xs font-semibold text-ink whitespace-nowrap">
        {shownCount > 0 ? (
          <>
            {shownCount}{' '}
            <span className="text-ink-faint font-medium">de {routes.length} rutas</span>
          </>
        ) : (
          `${routes.length} rutas`
        )}
      </span>
      <ChevronUp size={14} className="text-ink-faint shrink-0" />
    </button>
  )
}

interface RouteExplorerSheetProps {
  routes: RouteDetail[]
  onCollapse: () => void
}

/** Mobile bottom sheet hosting the route explorer. Positioning is owned by the parent. */
export function RouteExplorerSheet({ routes, onCollapse }: RouteExplorerSheetProps) {
  const [isCollapsing, setIsCollapsing] = useState(false)

  return (
    <div
      onAnimationEnd={(e) => {
        if (isCollapsing && e.target === e.currentTarget) {
          setIsCollapsing(false)
          onCollapse()
        }
      }}
      className={`glass rounded-4xl w-full max-h-[45dvh] flex flex-col overflow-hidden origin-bottom ${
        isCollapsing ? 'animate-sheet-out' : 'animate-sheet-in'
      }`}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 select-none">
        <span className="text-sm font-bold text-ink">Rutas</span>
        <button
          className="w-7 h-7 rounded-full bg-mist text-ink-soft hover:text-ink flex items-center justify-center cursor-pointer active:scale-90 transition-all"
          onClick={() => setIsCollapsing(true)}
          aria-label="Minimizar panel de rutas"
        >
          <ChevronDown size={15} />
        </button>
      </div>
      <div className="flex flex-col min-h-0 flex-1 px-2">
        <RouteExplorer routes={routes} />
      </div>
    </div>
  )
}
