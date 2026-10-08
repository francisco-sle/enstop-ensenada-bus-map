import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Turnstile } from '@marsidev/react-turnstile'
import { WifiOff } from 'lucide-react'

import { useRoutes } from './api/useRoutes'
import { useStops } from './api/useStops'
import { MapPage } from './pages/MapPage'
import { RoutesPage } from './pages/RoutesPage'
import { RouteDetailPage } from './pages/RouteDetailPage'
import { AboutPage } from './pages/AboutPage'
import { EditorPage } from './pages/EditorPage'
import type { RouteDetail } from './types'
import { Logo } from './components/Logo'
import { AppNav } from './components/Nav/AppNav'
import { ThemeCycleButton, ThemeToggle } from './components/Theme/ThemeToggle'

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
  const isMapPage = location.pathname === '/map' || location.pathname === '/'

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

  if (isStudio) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden bg-bay-950 text-white/92">
        <main className="flex-1 relative overflow-hidden">
          <Routes>
            <Route path="/studio" element={<EditorPage />} />
          </Routes>
        </main>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden bg-canvas text-ink">
      {/* Desktop header — floats over the map, sits in-flow on content pages */}
      <header
        className={`z-1002 hidden md:flex items-center justify-between gap-4 px-4 pt-4 pointer-events-none ${
          isMapPage ? 'absolute inset-x-0 top-0' : 'relative shrink-0 pb-2'
        }`}
      >
        {/* On the map page the logo lives inside the planner panel */}
        {!isMapPage && (
          <div className="pointer-events-auto pl-2">
            <Logo className="text-[26px] text-ink" />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <AppNav variant="bar" />
          <ThemeToggle variant="bar" />
        </div>
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
          <div className="flex flex-col items-center justify-center h-full gap-5 pb-dock">
            <div className="animate-pulse">
              <Logo className="text-4xl text-ink" />
            </div>
            <div className="w-40 h-1.5 skeleton rounded-full" />
            <p className="text-ink-faint text-xs font-medium">Cargando datos de transporte…</p>
          </div>
        ) : hasError ? (
          <div className="flex items-center justify-center h-full px-6 pb-dock">
            <div className="bg-paper shadow-float rounded-4xl p-8 max-w-sm flex flex-col items-center gap-3 text-center animate-enter">
              <div className="w-14 h-14 rounded-full bg-danger/10 text-danger flex items-center justify-center">
                <WifiOff size={26} />
              </div>
              <h3 className="text-lg font-bold">Sin conexión</h3>
              <p className="text-ink-soft text-sm">
                No se pudo establecer conexión con el servidor. Revisa tu conexión a internet o
                reintenta.
              </p>
              <button onClick={handleRetry} className="btn btn-primary rounded-full px-6 mt-2">
                Reintentar
              </button>
            </div>
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

      {/* Mobile floating dock */}
      <div
        className="md:hidden absolute inset-x-0 bottom-0 z-1002 flex justify-center gap-2 px-4 pointer-events-none"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
      >
        <AppNav variant="dock" />
        <ThemeCycleButton />
      </div>
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
