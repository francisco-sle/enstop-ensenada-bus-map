import { X, Save, Clock, Trash2, RotateCcw } from 'lucide-react'
import type { StudioSave, StudioSaveData } from '../../hooks/useStudioSaves'

interface SavesManagerProps {
  isOpen: boolean
  onClose: () => void
  saves: StudioSave[]
  onRestore: (data: StudioSaveData) => void
  onDelete: (id: string) => void
  onCreateManual: () => void
}

export function SavesManager({
  isOpen,
  onClose,
  saves,
  onRestore,
  onDelete,
  onCreateManual,
}: SavesManagerProps) {
  if (!isOpen) return null

  const handleRestore = (save: StudioSave) => {
    if (
      window.confirm(
        `¿Estás seguro de que deseas restaurar "${save.name}"? Los cambios actuales no guardados se perderán.`,
      )
    ) {
      onRestore(save.data)
      onClose()
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Deseas eliminar el guardado "${name}"?`)) {
      onDelete(id)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp))
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-bay-950/50">
          <div className="flex items-center gap-2">
            <Save size={18} className="text-pacific-400" />
            <h2 className="text-white font-bold font-display tracking-wide">Guardados Locales</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          <button onClick={onCreateManual} className="btn btn-primary w-full py-3">
            <Save size={16} />
            <span>Crear Guardado Manual</span>
          </button>

          <div className="flex flex-col gap-3 mt-2">
            <h3 className="text-xs font-semibold text-pacific-400 uppercase tracking-wider">
              Historial
            </h3>

            {saves.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-white/40">
                <Clock size={24} className="opacity-50" />
                <p className="text-xs">No hay guardados disponibles.</p>
              </div>
            ) : (
              saves.map((save) => (
                <div
                  key={save.id}
                  className="bg-surface-elevated border border-white/8 rounded-lg p-3 flex flex-col gap-3 group hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {save.type === 'autosave' && (
                          <span className="bg-amber-500/15 text-amber-400 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0">
                            Auto
                          </span>
                        )}
                        <span className="text-sm font-semibold text-white truncate">
                          {save.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/50 mt-1">
                        {formatDate(save.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-auto">
                    <button
                      onClick={() => handleRestore(save)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-pacific/10 text-white hover:text-pacific-300 rounded-md text-xs font-semibold transition-colors"
                    >
                      <RotateCcw size={14} />
                      <span>Restaurar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(save.id, save.name)}
                      className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                      title="Eliminar guardado"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
