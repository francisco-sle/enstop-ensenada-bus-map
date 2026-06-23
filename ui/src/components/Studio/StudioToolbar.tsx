import { Eye, Paintbrush, MapPin, Undo2, Redo2, Trash2, ArrowRightLeft } from 'lucide-react'

export type StudioMode = 'view' | 'draw-route' | 'add-stop'

interface StudioToolbarProps {
  mode: StudioMode
  setMode: (mode: StudioMode) => void
  onUndo: () => void
  canUndo: boolean
  onRedo: () => void
  canRedo: boolean
  onClearRoute: () => void
  canClearRoute: boolean
  onInvertRoute: () => void
  canInvertRoute: boolean
}

export function StudioToolbar({
  mode,
  setMode,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  onClearRoute,
  canClearRoute,
  onInvertRoute,
  canInvertRoute,
}: StudioToolbarProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2000] flex flex-col items-center gap-2 animate-slide-up">
      {/* Action tooltips based on active mode */}
      <div className="transition-all">
        {mode === 'draw-route' && (
          <div className="bg-amber-500/90 text-white backdrop-blur-md px-4 py-2 rounded-full text-xs font-medium shadow-lg mb-1 animate-fade-in border border-amber-400/50">
            <strong>Click Derecho + Arrastrar</strong> para pintar.
          </div>
        )}
        {mode === 'add-stop' && (
          <div className="bg-amber-500/90 text-white backdrop-blur-md px-4 py-2 rounded-full text-xs font-medium shadow-lg mb-1 animate-fade-in border border-amber-400/50">
            <strong>Click en el mapa</strong> para añadir parada.
          </div>
        )}
      </div>

      {/* Main floating bar */}
      <div className="bg-surface/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl flex items-center gap-2 relative before:absolute before:inset-0 before:pointer-events-none before:rounded-2xl before:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
        {/* Drawing modes */}
        <div className="flex bg-bay-950/50 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setMode('view')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'view'
                ? 'bg-pacific text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Eye size={16} />
            <span className="hidden sm:inline">Navegar</span>
          </button>

          <button
            onClick={() => setMode('draw-route')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'draw-route'
                ? 'bg-pacific text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Paintbrush size={16} />
            <span className="hidden sm:inline">Pintar</span>
          </button>

          <button
            onClick={() => setMode('add-stop')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'add-stop'
                ? 'bg-pacific text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <MapPin size={16} />
            <span className="hidden sm:inline">Paradas</span>
          </button>
        </div>

        <div className="w-[1px] h-8 bg-white/10 mx-1"></div>

        {/* History / Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            title="Deshacer (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            title="Rehacer (Ctrl+Shift+Z)"
          >
            <Redo2 size={16} />
          </button>

          <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

          <button
            onClick={onInvertRoute}
            disabled={!canInvertRoute}
            className="p-2.5 rounded-xl text-pacific-400 hover:text-pacific-300 hover:bg-pacific-400/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            title="Invertir Dirección"
          >
            <ArrowRightLeft size={16} />
          </button>

          <button
            onClick={onClearRoute}
            disabled={!canClearRoute}
            className="p-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            title="Borrar Ruta"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
