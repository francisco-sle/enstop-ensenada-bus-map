import { useState } from 'react'
import {
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Turnstile } from '@marsidev/react-turnstile'
import { Map, Bus, Info, AlertTriangle } from 'lucide-react'

import { useRoutes } from './api/useRoutes'
import { useStops } from './api/useStops'
import { MapPage } from './pages/MapPage'
import { RoutesPage } from './pages/RoutesPage'
import { RouteDetailPage } from './pages/RouteDetailPage'
import { AboutPage } from './pages/AboutPage'
import { EditorPage } from './pages/EditorPage'
import type { RouteDetail } from './types'

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function RouteDetailWrapper({ routes }: { routes: RouteDetail[] }) {
  const { routeId } = useParams<{ routeId: string }>()
  const navigate = useNavigate()

  const idNum = Number(routeId)
  const route = routes.find((r) => r.id === idNum)

  if (!route) {
    return <Navigate to="/routes" replace />
  }

  return <RouteDetailPage route={route} onBack={() => navigate('/routes')} />
}

function MainAppShell() {
  const location = useLocation()
  const isStudio = location.pathname === '/studio'

  // In local dev / CI (no VITE_TURNSTILE_SITE_KEY), seed Cloudflare's always-passing
  // test token so the Edge Function proxy is exercised without a real challenge.
  const hasTurnstile = !!import.meta.env.VITE_TURNSTILE_SITE_KEY
  const [turnstileToken, setTurnstileToken] = useState<string | null>(
    hasTurnstile ? null : '1x00000000000000000000AA',
  )

  // Fetch routes and stops
  const {
    data: routes,
    isLoading: loadingRoutes,
    error: routesError,
    refetch: refetchRoutes,
  } = useRoutes(turnstileToken)
  const {
    data: stops,
    isLoading: loadingStops,
    error: stopsError,
    refetch: refetchStops,
  } = useStops()

  const handleRetry = () => {
    refetchRoutes()
    refetchStops()
  }

  const isLoading = loadingRoutes || loadingStops
  const hasError = routesError || stopsError

  const desktopNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150 select-none',
      isActive
        ? 'bg-pacific-500/10 text-pacific-300'
        : 'text-white/60 hover:text-white hover:bg-white/5',
    ].join(' ')

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex flex-col items-center justify-center gap-1 h-full text-[11px] font-semibold transition-all duration-150 active:scale-92 select-none',
      isActive ? 'text-pacific-600' : 'text-slate-400 hover:text-slate-600',
    ].join(' ')

  if (isStudio) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden bg-bay-950">
        <main className="flex-1 relative overflow-hidden">
          <Routes>
            <Route path="/studio" element={<EditorPage />} />
          </Routes>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-bay-950">
      {/* Top Navbar */}
      <header className="h-14 shrink-0 flex items-center justify-center lg:justify-between px-4 lg:px-6 bg-surface border-b border-white/8 shadow-xs z-1002">
        <h1
          className="text-2xl font-normal tracking-wide text-white"
          style={{ fontFamily: 'var(--font-logo)' }}
        >
          ENSTOP
        </h1>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          <NavLink to="/map" className={desktopNavLinkClass} aria-label="Ir al mapa de rutas">
            <Map size={16} />
            <span>Mapa</span>
          </NavLink>

          <NavLink to="/routes" className={desktopNavLinkClass} aria-label="Ver todas las rutas">
            <Bus size={16} />
            <span>Rutas</span>
          </NavLink>

          <NavLink
            to="/about"
            className={desktopNavLinkClass}
            aria-label="Ver información del proyecto"
          >
            <Info size={16} />
            <span>Acerca</span>
          </NavLink>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {/* Cloudflare Turnstile — skipped in dev when VITE_TURNSTILE_SITE_KEY is unset */}
        {hasTurnstile && !turnstileToken && (
          <Turnstile
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
            onSuccess={(token: string) => setTurnstileToken(token)}
            options={{ appearance: 'interaction-only' }}
          />
        )}
        {isLoading || !turnstileToken ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 bg-bay-950">
            <div className="skeleton w-20 h-20 rounded-full" />
            <h3 className="text-base font-semibold">Cargando datos de transporte...</h3>
            <p className="text-muted text-xs">Espere un momento, por favor.</p>
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center bg-bay-950">
            <AlertTriangle size={48} className="text-[#E05050]" />
            <h3 className="text-lg font-bold">Error de Conexión</h3>
            <p className="text-muted text-sm max-w-xs">
              No se pudo establecer conexión con el servidor. Revisa tu conexión a internet o
              reintenta.
            </p>
            <button onClick={handleRetry} className="btn btn-primary mt-2">
              Reintentar
            </button>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/map" replace />} />

            <Route
              path="/map"
              element={<MapPage activeRoutes={routes || []} allStops={stops || []} />}
            />

            <Route path="/routes" element={<RoutesPage routes={routes || []} />} />

            <Route path="/routes/:routeId" element={<RouteDetailWrapper routes={routes || []} />} />

            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/map" replace />} />
          </Routes>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="h-[60px] shrink-0 grid grid-cols-3 bg-white border-t border-slate-200/80 z-1002 lg:hidden">
        <NavLink to="/map" className={mobileNavLinkClass} aria-label="Ir al mapa de rutas">
          <Map size={20} />
          <span>Mapa</span>
        </NavLink>

        <NavLink to="/routes" className={mobileNavLinkClass} aria-label="Ver todas las rutas">
          <Bus size={20} />
          <span>Rutas</span>
        </NavLink>

        <NavLink
          to="/about"
          className={mobileNavLinkClass}
          aria-label="Ver información del proyecto"
        >
          <Info size={20} />
          <span>Acerca</span>
        </NavLink>
      </nav>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainAppShell />
    </QueryClientProvider>
  )
}

export default App
