import { Routes, Route, Navigate, NavLink, useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Map, Bus, Info, AlertTriangle } from 'lucide-react'

import { useRoutes } from './api/useRoutes'
import { useStops } from './api/useStops'
import { useMapStore } from './store/mapStore'
import { MapPage } from './pages/MapPage'
import { RoutesPage } from './pages/RoutesPage'
import { RouteDetailPage } from './pages/RouteDetailPage'
import { AboutPage } from './pages/AboutPage'
import type { RouteDetail } from './types'

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
})

function RouteDetailWrapper({ routes }: { routes: RouteDetail[] }) {
  const { routeId } = useParams<{ routeId: string }>()
  const navigate = useNavigate()
  const { setSelectedRouteId } = useMapStore()

  const idNum = Number(routeId)
  const route = routes.find(r => r.id === idNum)

  useEffect(() => {
    if (!isNaN(idNum)) {
      setSelectedRouteId(idNum)
    }
  }, [idNum, setSelectedRouteId])

  if (!route) {
    return <Navigate to="/routes" replace />
  }

  return <RouteDetailPage route={route} onBack={() => navigate('/routes')} />
}

function MainAppShell() {

  // Fetch routes and stops
  const { data: routes, isLoading: loadingRoutes, error: routesError, refetch: refetchRoutes } = useRoutes()
  const { data: stops, isLoading: loadingStops, error: stopsError, refetch: refetchStops } = useStops()


  const handleRetry = () => {
    refetchRoutes()
    refetchStops()
  }

  const isLoading = loadingRoutes || loadingStops
  const hasError = routesError || stopsError


  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex flex-col items-center justify-center gap-1 h-full text-[11px] font-semibold transition-colors duration-150 select-none',
      isActive ? 'text-teal-400' : 'text-white/50 hover:text-white/80'
    ].join(' ')

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-navy-600">
      {/* Top Navbar */}
      <header className="h-14 shrink-0 flex items-center justify-center px-4 bg-surface border-b border-white/8 shadow-card z-1002">
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-wide text-teal-400 font-display">
          <span>🚌</span> ENStop
        </h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 bg-navy-600">
            <div className="skeleton w-20 h-20 rounded-full" />
            <h3 className="text-base font-semibold">Cargando datos de transporte...</h3>
            <p className="text-muted text-xs">Espere un momento, por favor.</p>
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center bg-navy-600">
            <AlertTriangle size={48} className="text-[#E05050]" />
            <h3 className="text-lg font-bold">Error de Conexión</h3>
            <p className="text-muted text-sm max-w-xs">
              No se pudo establecer conexión con el servidor. Revisa tu conexión a internet o reintenta.
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
              element={
                <MapPage
                  activeRoutes={routes as unknown as RouteDetail[] || []}
                  allStops={stops || []}
                />
              }
            />

            <Route
              path="/routes"
              element={
                <RoutesPage
                  routes={routes as unknown as RouteDetail[] || []}
                />
              }
            />

            <Route
              path="/routes/:routeId"
              element={<RouteDetailWrapper routes={routes as unknown as RouteDetail[] || []} />}
            />

            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/map" replace />} />
          </Routes>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="h-[60px] shrink-0 grid grid-cols-3 bg-surface border-t border-white/8 z-1002">
        <NavLink to="/map" className={navLinkClass} aria-label="Ir al mapa de rutas">
          <Map size={20} />
          <span>Mapa</span>
        </NavLink>

        <NavLink
          to="/routes"
          className={navLinkClass}
          aria-label="Ver todas las rutas"
        >
          <Bus size={20} />
          <span>Rutas</span>
        </NavLink>

        <NavLink to="/about" className={navLinkClass} aria-label="Ver información del proyecto">
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
