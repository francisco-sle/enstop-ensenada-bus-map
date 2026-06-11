import { X, MapPin, Accessibility, Check } from 'lucide-react'
import { useState } from 'react'
import { useMapStore } from '../../store/mapStore'
import { useRoutingStore } from '../../store/routingStore'
import { useRoutesForStop } from '../../api/useRoutesForStop'
import type { DBStop } from '../../types'

interface StopDrawerProps {
  stop: DBStop | undefined
  onClose: () => void
  variant?: 'drawer' | 'inline'
}

export function StopDrawer({ stop, onClose, variant = 'drawer' }: StopDrawerProps) {
  const { setOrigin, setDestination } = useRoutingStore()
  const { setSelectedRouteId } = useMapStore()
  const { data: routes, isLoading: loadingRoutes } = useRoutesForStop(stop?.id || null)

  const [isCheckedIn, setIsCheckedIn] = useState(false)

  if (!stop) return null

  const handleCheckIn = () => {
    setIsCheckedIn(true)
    const [lng, lat] = stop.geom.coordinates
    setOrigin({
      lat,
      lng,
      label: stop.name
    })
  }

  const handleSetOrigin = () => {
    const [lng, lat] = stop.geom.coordinates
    setOrigin({
      lat,
      lng,
      label: stop.name
    })
  }

  const handleSetDestination = () => {
    const [lng, lat] = stop.geom.coordinates
    setDestination({
      lat,
      lng,
      label: stop.name
    })
  }

  const isInline = variant === 'inline'

  return (
    <div className={
      isInline
        ? "bg-surface rounded-xl border border-white/8 p-4 flex flex-col gap-3 select-none animate-fade-up mt-2"
        : "absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl shadow-card p-4 z-1001 max-h-[70%] overflow-y-auto border-t border-white/8 flex flex-col gap-3 animate-slide-up select-none"
    }>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex gap-2 items-center">
          <MapPin size={24} className="text-pacific-400" />
          <div>
            <h3 className="text-lg font-bold text-white">{stop.name}</h3>
            {stop.common_name && (
              <span className="text-muted text-xs block mt-0.5">
                Alias: {stop.common_name}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar detalles de parada"
          className="text-white/50 hover:text-white p-1 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Attributes */}
      <div className="flex gap-3 flex-wrap">
        {stop.accessible && (
          <div className="flex items-center gap-1 text-[11px] font-semibold bg-pacific-500/10 text-pacific-300 px-2 py-1 rounded-sm">
            <Accessibility size={14} />
            <span>Accesible</span>
          </div>
        )}
        {stop.is_terminal && (
          <div className="text-[11px] font-bold bg-sol-500/10 text-sol-300 px-2 py-1 rounded-sm">
            Terminal
          </div>
        )}
      </div>

      {/* Routes Serving Stop */}
      <div>
        <h4 className="text-xs font-semibold text-white/50 mb-2">
          Rutas que pasan por aquí:
        </h4>
        {loadingRoutes ? (
          <div className="skeleton h-10 w-full" />
        ) : routes && routes.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {routes.map(route => (
              <button
                key={route.id}
                onClick={() => setSelectedRouteId(route.id)}
                className="bg-bay-700/40 border border-white/8 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-white hover:bg-bay-700/80 active:scale-95 transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-pacific-400"></span>
                {route.short_name}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-muted text-xs">
            No hay rutas activas registradas para esta parada.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={handleSetOrigin}
          className="btn w-full bg-white/5 hover:bg-white/10 text-white/95"
        >
          Partir de aquí
        </button>
        <button
          onClick={handleSetDestination}
          className="btn w-full bg-white/5 hover:bg-white/10 text-white/95"
        >
          Destino final
        </button>
      </div>

      {/* Check-in option */}
      <button
        onClick={handleCheckIn}
        disabled={isCheckedIn}
        className={`btn w-full mt-1 flex gap-2 items-center justify-center ${
          isCheckedIn
            ? 'bg-pacific-600/20 text-pacific-300 border-pacific-500/25 cursor-default'
            : 'btn-primary'
        }`}
      >
        {isCheckedIn ? (
          <>
            <Check size={18} />
            <span>¡Registrado aquí! (Origen fijado)</span>
          </>
        ) : (
          <span>Estoy en esta parada</span>
        )}
      </button>
    </div>
  )
}
