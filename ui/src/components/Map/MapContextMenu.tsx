import { useRef, useLayoutEffect, useState } from 'react'
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
  const menuRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null)

  useLayoutEffect(() => {
    if (!menuRef.current) return
    const menuEl = menuRef.current
    const parentEl = menuEl.parentElement
    if (!parentEl) return

    const menuRect = menuEl.getBoundingClientRect()
    const parentRect = parentEl.getBoundingClientRect()

    let newX = position.x
    let newY = position.y

    if (position.x + menuRect.width > parentRect.width) {
      newX = Math.max(8, parentRect.width - menuRect.width - 8)
    }
    if (position.y + menuRect.height > parentRect.height) {
      newY = Math.max(8, parentRect.height - menuRect.height - 8)
    }

    setCoords({ x: newX, y: newY })
  }, [position])

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
      ref={menuRef}
      style={{
        left: coords?.x ?? position.x,
        top: coords?.y ?? position.y,
        opacity: coords ? 1 : 0,
      }}
      className="absolute z-1001 flex flex-col min-w-[150px] bg-surface rounded-lg overflow-hidden border border-white/8 shadow-card select-none animate-fade-up transition-opacity duration-75 py-1"
    >
      <button
        onClick={handleSetOrigin}
        className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-bold text-pacific-400 hover:bg-white/5 border-b border-white/6 text-left w-full cursor-pointer transition-colors"
      >
        <MapPin size={14} />
        <span>Origen</span>
      </button>
      <button
        onClick={handleSetDestination}
        className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-bold text-sol-400 hover:bg-white/5 text-left w-full cursor-pointer transition-colors"
      >
        <Navigation size={14} />
        <span>Destino</span>
      </button>
    </div>
  )
}
