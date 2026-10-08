import type { CSSProperties } from 'react'
import { ArrowLeft, MapPin, Accessibility } from 'lucide-react'
import { BusMap } from '../components/Map/BusMap'
import { FareTable } from '../components/RouteDetail/FareTable'
import { FARES } from '../constants/fares'
import { useMapStore } from '../store/mapStore'
import type { RouteDetail, DBStop } from '../types'

interface RouteDetailPageProps {
  route: RouteDetail
  onBack: () => void
}

export function RouteDetailPage({ route, onBack }: RouteDetailPageProps) {
  const { setCenter, setZoom, setSelectedStopId } = useMapStore()

  const routeStops = route.route_stops || []
  const stops = routeStops.map((rs) => rs.stop)

  const dummyFares = [
    {
      id: 1,
      route_id: route.id,
      passenger_type: 'normal' as const,
      fare_mxn: FARES.NORMAL,
      effective_from: '2025-01-01',
      notes: '',
      updated_at: '',
    },
    {
      id: 2,
      route_id: route.id,
      passenger_type: 'student' as const,
      fare_mxn: FARES.STUDENT,
      effective_from: '2025-01-01',
      notes: '',
      updated_at: '',
    },
    {
      id: 3,
      route_id: route.id,
      passenger_type: 'senior' as const,
      fare_mxn: FARES.SENIOR,
      effective_from: '2025-01-01',
      notes: '',
      updated_at: '',
    },
    {
      id: 4,
      route_id: route.id,
      passenger_type: 'disability' as const,
      fare_mxn: FARES.DISABILITY,
      effective_from: '2025-01-01',
      notes: '',
      updated_at: '',
    },
    {
      id: 5,
      route_id: route.id,
      passenger_type: 'disability_free' as const,
      fare_mxn: FARES.DISABILITY_FREE,
      effective_from: '2025-01-01',
      notes: '',
      updated_at: '',
    },
  ]

  const handleStopClick = (stop: DBStop) => {
    const [lng, lat] = stop.geom.coordinates
    setCenter([lat, lng])
    setZoom(15)
    setSelectedStopId(stop.id)
  }

  const color = route.brand?.color_hex || route.category?.color_hex || '#3DBFA8'
  const sectionTitle = 'text-[11px] font-bold uppercase tracking-wider text-ink-faint px-1 mb-2'

  return (
    <div className="route-detail h-full flex flex-col md:flex-row md:gap-4 md:p-4 md:pt-2 overflow-hidden select-none">
      {/* Map Preview */}
      <div className="relative h-[40%] md:h-auto md:order-2 md:flex-1 shrink-0 md:rounded-4xl overflow-hidden md:shadow-float animate-enter">
        <BusMap
          activeRoutes={[route]}
          allStops={stops}
          showFullRoutes={false}
          showRouting={false}
          focusedRouteId={route.id}
          ignoreVisibility={true}
        />
        <button
          onClick={onBack}
          aria-label="Volver a lista de rutas"
          className="md:hidden fab w-11 h-11 absolute left-3 z-1000"
          style={{ top: 'calc(12px + env(safe-area-inset-top, 0px))' }}
        >
          <ArrowLeft size={19} />
        </button>
      </div>

      {/* Details — on mobile a sheet that overlaps the map */}
      <div className="md:order-1 md:w-[400px] flex-1 md:flex-none min-h-0 overflow-y-auto relative z-10 -mt-7 md:mt-0 bg-canvas rounded-t-4xl md:rounded-none md:bg-transparent px-4 pt-5 md:pt-1 pb-dock">
        <div className="flex flex-col gap-6 pb-6">
          {/* Header */}
          <div className="flex items-center gap-3 animate-enter">
            <button
              onClick={onBack}
              aria-label="Volver a lista de rutas"
              className="hidden md:flex fab w-11 h-11 shrink-0"
            >
              <ArrowLeft size={19} />
            </button>
            <span
              style={{ backgroundColor: color }}
              className="w-12 h-12 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-soft [text-shadow:0_1px_1px_rgb(0_0_0/0.3)]"
            >
              {route.short_name}
            </span>
            <div className="flex flex-col min-w-0">
              <h2 className="text-xl font-extrabold tracking-tight text-ink truncate">
                {route.name.split('—')[1]?.trim() || route.name}
              </h2>
              {route.brand && (
                <p className="text-xs text-ink-faint font-medium truncate">{route.brand.name}</p>
              )}
            </div>
          </div>

          {/* Description */}
          {route.description && (
            <p className="text-sm text-ink-soft leading-relaxed px-1 -mt-2 animate-enter">
              {route.description}
            </p>
          )}

          {/* Fares */}
          <section className="animate-enter">
            <h3 className={sectionTitle}>Tarifas</h3>
            <FareTable fares={dummyFares} isLoading={false} />
          </section>

          {/* Stops Sequence — timeline */}
          <section className="animate-enter">
            <h3 className={sectionTitle}>Paradas ({stops.length})</h3>
            <ol className="relative bg-paper rounded-3xl shadow-soft p-1.5 m-0 list-none">
              {/* Route spine */}
              <span
                aria-hidden
                className="absolute left-[27px] top-6 bottom-6 w-[3px] rounded-full opacity-30"
                style={{ backgroundColor: color }}
              />
              {routeStops.map((rs, i) => (
                <li
                  key={rs.id}
                  className="relative animate-enter stagger"
                  style={{ '--i': i } as CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => handleStopClick(rs.stop)}
                    className="group w-full flex items-center gap-3 px-2.5 py-2.5 rounded-2xl text-left cursor-pointer hover:bg-mist transition-colors"
                  >
                    <span
                      className="relative z-10 w-6 h-6 rounded-full bg-paper border-[3px] flex items-center justify-center text-[9px] font-extrabold text-ink-soft shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{ borderColor: color, transitionTimingFunction: 'var(--ease-spring)' }}
                    >
                      {rs.sequence}
                    </span>
                    <span className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-semibold text-ink truncate">
                        {rs.stop.name}
                      </span>
                      {rs.stop.common_name && (
                        <span className="text-ink-faint text-[11px] truncate">
                          {rs.stop.common_name}
                        </span>
                      )}
                    </span>
                    {rs.stop.accessible && (
                      <Accessibility size={14} className="text-accent shrink-0" />
                    )}
                    <MapPin
                      size={15}
                      className="text-ink-faint/60 group-hover:text-accent transition-colors shrink-0"
                    />
                  </button>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  )
}
