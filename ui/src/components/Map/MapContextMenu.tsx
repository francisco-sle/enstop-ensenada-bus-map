import { useRef, useLayoutEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
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

  const itemClass =
    'flex items-center gap-3 px-3 py-2.5 text-[13px] font-semibold text-ink hover:bg-mist rounded-xl text-left w-full cursor-pointer transition-colors'

  return (
    <div
      ref={menuRef}
      style={{
        left: coords?.x ?? position.x,
        top: coords?.y ?? position.y,
        visibility: coords ? 'visible' : 'hidden',
      }}
      className="glass absolute z-1001 flex flex-col min-w-[180px] rounded-3xl p-1.5 select-none origin-top-left animate-scale-in"
    >
      <span className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
        Usar este punto como
      </span>
      <button onClick={handleSetOrigin} className={itemClass}>
        <span className="w-3 h-3 rounded-full border-[3px] border-pacific-500" />
        <span>Origen</span>
      </button>
      <button onClick={handleSetDestination} className={itemClass}>
        <MapPin size={14} strokeWidth={2.5} className="text-warm" />
        <span>Destino</span>
      </button>
    </div>
  )
}
