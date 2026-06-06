import { ArrowLeft, MapPin, Accessibility } from 'lucide-react'
import { BusMap } from '../components/Map/BusMap'
import { FareTable } from '../components/RouteDetail/FareTable'
import { useMapStore } from '../store/mapStore'
import type { RouteDetail, DBStop } from '../types'

interface RouteDetailPageProps {
  route: RouteDetail
  onBack: () => void
}

export function RouteDetailPage({ route, onBack }: RouteDetailPageProps) {
  const { setCenter, setZoom, setSelectedStopId } = useMapStore()

  const routeStops = route.route_stops || []
  const stops = routeStops.map(rs => rs.stop)

  const dummyFares = [
    { id: 1, route_id: route.id, passenger_type: 'normal' as const, fare_mxn: 13.00, effective_from: '2024-01-01', notes: '', updated_at: '' },
    { id: 2, route_id: route.id, passenger_type: 'student_government' as const, fare_mxn: 7.00, effective_from: '2024-01-01', notes: '', updated_at: '' },
    { id: 3, route_id: route.id, passenger_type: 'student_highschool' as const, fare_mxn: 10.00, effective_from: '2024-01-01', notes: '', updated_at: '' },
    { id: 4, route_id: route.id, passenger_type: 'disability' as const, fare_mxn: 7.00, effective_from: '2024-01-01', notes: '', updated_at: '' }
  ]

  const handleStopClick = (stop: DBStop) => {
    const [lng, lat] = stop.geom.coordinates
    setCenter([lat, lng])
    setZoom(15)
    setSelectedStopId(stop.id)
  }

  return (
    <div className="grid grid-rows-[auto_240px_1fr] h-full overflow-hidden select-none animate-fade-up">
      {/* Header */}
      <div className="px-4 py-3 bg-surface border-b border-white/8 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Volver a lista de rutas"
          className="text-white/70 hover:text-white min-w-11 min-h-11 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2 overflow-hidden">
          <span
            style={{ backgroundColor: route.category?.color_hex || '#3DBFA8' }}
            className="text-navy-900 font-extrabold text-[10px] px-2 py-0.5 rounded-sm shrink-0"
          >
            {route.short_name}
          </span>
          <h2 className="text-sm font-bold text-white truncate">
            {route.name.split('—')[1] || route.name}
          </h2>
        </div>
      </div>

      {/* Map Preview */}
      <div className="relative border-b border-white/8 bg-navy-800">
        <BusMap activeRoutes={[route]} allStops={stops} showRouting={false} />
      </div>

      {/* Details (Stops list & Fare Table) */}
      <div className="overflow-y-auto p-4 flex flex-col gap-4">
        {/* Description */}
        {route.description && (
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold text-white/50">Descripción</h3>
            <p className="text-sm text-white/80 leading-relaxed bg-navy-600/20 border border-white/4 rounded-lg p-3">
              {route.description}
            </p>
          </div>
        )}

        {/* Fares */}
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold text-white/50">Estructura Tarifaria</h3>
          <FareTable fares={dummyFares} isLoading={false} />
        </div>

        {/* Stops Sequence */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-white/50">
            Secuencia de Paradas ({stops.length})
          </h3>
          <div className="flex flex-col gap-2">
            {routeStops.map((rs) => (
              <div
                key={rs.id}
                onClick={() => handleStopClick(rs.stop)}
                className="bg-surface border border-white/8 rounded-xl p-3 cursor-pointer hover:bg-surface-elevated hover:border-white/12 transition-all flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex gap-3 items-center overflow-hidden">
                  <span className="bg-navy-600/50 text-white/50 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 group-hover:bg-teal-400 group-hover:text-navy-900 transition-colors">
                    {rs.sequence}
                  </span>
                  <div className="truncate">
                    <span className="text-sm font-semibold text-white/90 group-hover:text-teal-400 transition-colors block truncate">
                      {rs.stop.name}
                    </span>
                    {rs.stop.common_name && (
                      <span className="text-muted text-[10px] block mt-0.5 truncate">
                        {rs.stop.common_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {rs.stop.accessible && <Accessibility size={14} className="text-teal-400" />}
                  <MapPin size={16} className="text-white/30 group-hover:text-teal-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
