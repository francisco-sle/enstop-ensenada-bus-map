import { X, MapPin, Accessibility, Check, Radio, BusFront } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { useMapStore } from '../../store/mapStore'
import { useRoutingStore } from '../../store/routingStore'
import type { DBStop, RouteDetail } from '../../types'

interface StopDrawerProps {
  stop: DBStop | undefined
  activeRoutes: RouteDetail[]
  onClose: () => void
  variant?: 'drawer' | 'inline' | 'floating'
}

export function StopDrawer({ stop, activeRoutes, onClose, variant = 'drawer' }: StopDrawerProps) {
  const { setOrigin, setDestination } = useRoutingStore()
  const { selectedRouteId, setSelectedRouteId, setSelectedStopId } = useMapStore()

  // Derive routes serving this stop from activeRoutes
  const routes = stop
    ? activeRoutes.filter((r) => (r.route_stops ?? []).some((rs) => rs.stop_id === stop.id))
    : []
  const loadingRoutes = false

  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  if (!stop) return null

  const handleCheckIn = () => {
    setIsCheckedIn(true)
    const [lng, lat] = stop.geom.coordinates
    setOrigin({
      lat,
      lng,
      label: stop.name,
    })
    setSelectedStopId(null)
  }

  const handleSetOrigin = () => {
    const [lng, lat] = stop.geom.coordinates
    setOrigin({
      lat,
      lng,
      label: stop.name,
    })
    setSelectedStopId(null)
  }

  const handleSetDestination = () => {
    const [lng, lat] = stop.geom.coordinates
    setDestination({
      lat,
      lng,
      label: stop.name,
    })
    setSelectedStopId(null)
  }

  const isDrawer = variant === 'drawer'
  // Play the exit animation first; unmount once it finishes
  const handleClose = () => setIsClosing(true)

  const enterClass = isDrawer ? 'animate-sheet-in' : 'animate-enter'
  const exitClass = isDrawer ? 'animate-sheet-out' : 'animate-exit'

  return (
    <div
      onAnimationEnd={(e) => {
        if (isClosing && e.target === e.currentTarget) onClose()
      }}
      className={`glass rounded-4xl p-4 flex flex-col gap-4 select-none ${
        isClosing ? exitClass : enterClass
      } ${
        isDrawer
          ? 'absolute left-3 right-3 bottom-(--dock-h) z-1001 max-h-[65%] overflow-y-auto'
          : variant === 'inline'
            ? 'mt-2'
            : 'w-full'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex gap-3 items-center min-w-0">
          <span className="w-11 h-11 rounded-2xl bg-accent-tint text-accent flex items-center justify-center shrink-0">
            <BusFront size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-ink leading-tight">{stop.name}</h3>
            {stop.common_name && (
              <span className="text-ink-faint text-xs block mt-0.5 truncate">
                {stop.common_name}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleClose}
          aria-label="Cerrar detalles de parada"
          className="w-8 h-8 shrink-0 rounded-full bg-mist text-ink-soft hover:text-ink hover:bg-mist-strong flex items-center justify-center transition-colors cursor-pointer active:scale-90"
        >
          <X size={16} />
        </button>
      </div>

      {/* Attributes */}
      {(stop.accessible || stop.is_terminal) && (
        <div className="flex gap-2 flex-wrap -mt-1">
          {stop.accessible && (
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-accent-tint text-accent-strong px-2.5 py-1 rounded-full">
              <Accessibility size={13} />
              Accesible
            </span>
          )}
          {stop.is_terminal && (
            <span className="text-[11px] font-semibold bg-warm-tint text-warm-strong px-2.5 py-1 rounded-full">
              Terminal
            </span>
          )}
        </div>
      )}

      {/* Routes Serving Stop */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-faint mb-2">
          Rutas en esta parada
        </h4>
        {loadingRoutes ? (
          <div className="skeleton h-9 w-full" />
        ) : routes && routes.length > 0 ? (
          <div className="flex gap-1.5 flex-wrap">
            {routes.map((route, i) => {
              const isActive = selectedRouteId === route.id
              return (
                <button
                  key={route.id}
                  onClick={() => setSelectedRouteId(isActive ? null : route.id)}
                  style={{ '--i': i } as CSSProperties}
                  className={`rounded-full pl-2 pr-3 py-1.5 flex items-center gap-1.5 text-xs font-bold transition-[background-color,color,scale] duration-200 active:scale-95 cursor-pointer animate-scale-in stagger ${
                    isActive ? 'bg-ink text-paper' : 'bg-mist text-ink hover:bg-mist-strong'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-paper/80"
                    style={{
                      backgroundColor:
                        route.brand?.color_hex || route.category?.color_hex || '#3DBFA8',
                    }}
                  />
                  {route.short_name}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-ink-faint text-xs">
            No hay rutas activas registradas para esta parada.
          </div>
        )}
      </div>

      {/* Actions Row */}
      <div className="flex gap-2 w-full">
        <button onClick={handleSetOrigin} className="btn btn-soft flex-1 rounded-2xl h-12 px-3">
          <span className="w-3 h-3 rounded-full border-[3px] border-pacific-500" />
          <span className="text-[13px] font-semibold">Salir de aquí</span>
        </button>

        <button
          onClick={handleSetDestination}
          className="btn btn-soft flex-1 rounded-2xl h-12 px-3"
        >
          <MapPin size={15} strokeWidth={2.5} className="text-warm" />
          <span className="text-[13px] font-semibold">Ir aquí</span>
        </button>

        <button
          onClick={handleCheckIn}
          disabled={isCheckedIn}
          title={isCheckedIn ? '¡Fijado como origen!' : 'Estoy en esta parada (Marcar como origen)'}
          aria-label="Estoy en esta parada"
          className={`btn shrink-0 w-12 h-12 p-0 rounded-2xl ${
            isCheckedIn ? 'bg-success/15 text-success cursor-default' : 'btn-primary shadow-soft'
          }`}
        >
          {isCheckedIn ? <Check size={18} /> : <Radio size={18} />}
        </button>
      </div>
    </div>
  )
}
