import { NavLink, useLocation } from 'react-router-dom'
import { Map, Bus, Info } from 'lucide-react'

const ITEMS = [
  { to: '/map', label: 'Mapa', icon: Map, aria: 'Ir al mapa de rutas' },
  { to: '/routes', label: 'Rutas', icon: Bus, aria: 'Ver todas las rutas' },
  { to: '/about', label: 'Acerca', icon: Info, aria: 'Ver información del proyecto' },
] as const

function useActiveIndex() {
  const { pathname } = useLocation()
  const index = ITEMS.findIndex((item) => pathname.startsWith(item.to))
  return index === -1 ? 0 : index
}

/**
 * Primary navigation. `bar` is the compact desktop pill (top-right),
 * `dock` is the floating bottom dock on mobile. Both share a sliding
 * indicator that springs to the active item.
 */
export function AppNav({ variant }: { variant: 'bar' | 'dock' }) {
  const activeIndex = useActiveIndex()
  const isDock = variant === 'dock'

  return (
    <nav
      className={
        isDock
          ? 'glass pointer-events-auto relative grid grid-cols-3 h-15 rounded-full p-1.5 w-full max-w-sm'
          : 'glass pointer-events-auto relative grid grid-cols-3 rounded-full p-1 w-[312px]'
      }
    >
      {/* Sliding indicator — one third of the inner width, translated per item */}
      <span
        aria-hidden
        className={`absolute rounded-full bg-ink transition-transform duration-500 ${
          isDock
            ? 'inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/3)]'
            : 'inset-y-1 left-1 w-[calc((100%-0.5rem)/3)]'
        }`}
        style={{
          transform: `translateX(${activeIndex * 100}%)`,
          transitionTimingFunction: 'var(--ease-spring)',
        }}
      />
      {ITEMS.map(({ to, label, icon: Icon, aria }) => (
        <NavLink
          key={to}
          to={to}
          aria-label={aria}
          className={({ isActive }) =>
            [
              'relative z-10 flex items-center justify-center rounded-full font-semibold select-none transition-[color,transform] duration-300 active:scale-95',
              isDock ? 'flex-col gap-0.5 text-[11px]' : 'gap-1.5 py-2 text-sm',
              isActive ? 'text-paper' : 'text-ink-soft hover:text-ink',
            ].join(' ')
          }
        >
          <Icon size={isDock ? 19 : 16} strokeWidth={2.2} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
