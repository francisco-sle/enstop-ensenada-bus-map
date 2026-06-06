import { MapPin, Navigation } from 'lucide-react'
import { useRoutingStore } from '../../store/routingStore'

export interface ContextMenuPosition {
  lat: number
  lng: number
  x: number
  y: number
}

interface MapContextMenuProps {
  position: ContextMenuPosition
  onClose: () => void
}

/**
 * Overlay context menu rendered at a specific pixel position on the map canvas.
 * Provides "Set as Origin" and "Set as Destination" actions for a right-clicked coordinate.
 *
 * @example
 * {contextMenu && (
 *   <MapContextMenu position={contextMenu} onClose={() => setContextMenu(null)} />
 * )}
 */
export function MapContextMenu({ position, onClose }: MapContextMenuProps) {
  const { setOrigin, setDestination } = useRoutingStore()
  const coordLabel = `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`

  const handleSetOrigin = () => {
    setOrigin({ lat: position.lat, lng: position.lng, label: `Origen (${coordLabel})` })
    onClose()
  }

  const handleSetDestination = () => {
    setDestination({ lat: position.lat, lng: position.lng, label: `Destino (${coordLabel})` })
    onClose()
  }

  return (
    <div
      style={{ left: position.x, top: position.y }}
      className="absolute z-1001 flex flex-col min-w-[130px] bg-surface rounded-lg overflow-hidden border border-white/8 shadow-card select-none animate-fade-up"
    >
      <button
        onClick={handleSetOrigin}
        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-teal-400 hover:bg-white/5 border-b border-white/6 text-left w-full cursor-pointer transition-colors"
      >
        <MapPin size={12} />
        <span>Origen</span>
      </button>
      <button
        onClick={handleSetDestination}
        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-amber-400 hover:bg-white/5 text-left w-full cursor-pointer transition-colors"
      >
        <Navigation size={12} />
        <span>Destino</span>
      </button>
    </div>
  )
}
