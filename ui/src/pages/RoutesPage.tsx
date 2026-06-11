import { Link } from 'react-router-dom'
import { Bus, ArrowRight } from 'lucide-react'
import type { RouteDetail } from '../types'
import { RouteThumbnail } from '../components/RouteThumbnail'

interface RoutesPageProps {
  routes: RouteDetail[]
}

export function RoutesPage({ routes }: RoutesPageProps) {
  return (
    <div className="p-4 h-full overflow-y-auto flex flex-col gap-4 max-w-xl mx-auto select-none animate-fade-up">
      <div>
        <h2 className="text-2xl font-extrabold text-white font-display">Rutas de Microbús</h2>
        <p className="text-muted text-sm mt-1">
          Explora los recorridos y paradas autorizadas del transporte público en Ensenada, BC.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {routes.map(route => (
          <Link
            key={route.id}
            to={`/routes/${route.id}`}
            className="bg-surface rounded-xl border border-white/8 flex items-center justify-between hover:bg-surface-elevated hover:border-white/12 transition-all duration-200 group active:scale-[0.99] cursor-pointer overflow-hidden h-20"
          >
            <div className="flex gap-4 items-center overflow-hidden flex-1 pl-4 py-4 pr-3">
              <div
                style={{ backgroundColor: route.category?.color_hex || '#3DBFA8' }}
                className="shrink-0 text-bay-950 w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-md group-hover:scale-105 transition-transform"
              >
                {route.short_name}
              </div>
              <div className="truncate">
                <h3 className="text-sm font-bold text-white group-hover:text-pacific-400 transition-colors truncate">
                  {route.name.split('—')[1] || route.name}
                </h3>
                <p className="text-muted text-[11px] mt-0.5 flex items-center gap-1">
                  <Bus size={12} />
                  <span>
                    {route.route_stops?.length || 0} Paradas • Sentido{' '}
                    {route.direction === 'circular' ? 'Circular' : 'Ida/Vuelta'}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="relative h-full w-24 sm:w-36 shrink-0 border-l border-white/8 group-hover:border-white/12 transition-colors duration-200">
              <RouteThumbnail 
                geom={route.geom} 
                color={route.category?.color_hex || '#3DBFA8'} 
                className="w-full h-full opacity-85 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-bay-950/70 backdrop-blur-md p-1.5 rounded-full border border-white/10 text-white/50 group-hover:text-pacific-400 group-hover:border-pacific-500/20 group-hover:scale-105 transition-all shadow-md pointer-events-none">
                <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
