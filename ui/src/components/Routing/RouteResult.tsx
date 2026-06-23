import { useRoutingStore } from '../../store/routingStore'
import { Bus, Clock } from 'lucide-react'

export function RouteResult() {
  const { routingResults, selectedResultIndex, setSelectedResultIndex } = useRoutingStore()

  if (routingResults.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold flex items-center gap-1.5 text-pacific-400 select-none">
        <Clock size={16} />
        <span>Rutas Recomendadas:</span>
      </h3>

      <div className="flex flex-col gap-2">
        {routingResults.map((result, index) => {
          const isSelected = selectedResultIndex === index
          const busMin = Math.round((result.busDistanceKm / 20) * 60)

          return (
            <div
              key={index}
              onClick={() => setSelectedResultIndex(index)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 flex flex-col gap-2 ${
                isSelected
                  ? 'bg-surface-elevated border-pacific-400'
                  : 'bg-bay-900 border-white/5 hover:bg-bay-800 hover:border-white/10'
              }`}
            >
              {/* Badge & Time Summary */}
              <div className="flex justify-between items-center select-none pb-0.5">
                <div className="flex flex-col overflow-hidden mr-3 gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-[3px] rounded text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] border border-white/20 font-black text-[11px] leading-none shrink-0"
                      style={{ backgroundColor: result.routeColor }}
                    >
                      {result.routeShortName}
                    </span>
                    <span className="text-sm font-bold text-white/95 truncate">
                      {result.routeName.split('—')[1] || result.routeName}
                    </span>
                  </div>
                  {result.routeBrandName && (
                    <span className="text-[10px] text-white/40 truncate font-medium">
                      {result.routeBrandName}
                    </span>
                  )}
                </div>
                <div className="shrink-0 flex items-baseline">
                  <span className="text-base font-bold text-white/80">~{busMin}</span>
                  <span className="text-[10px] text-white/40 ml-0.5 font-medium">min</span>
                </div>
              </div>

              {/* Step-by-Step Directions */}
              {isSelected && (
                <div className="flex flex-col text-xs mt-1.5 bg-black/20 rounded-lg p-3 border border-white/5 shadow-inner animate-fade-up">
                  <div className="flex gap-2">
                    <div className="flex flex-col items-center w-4 shrink-0">
                      <div className="w-3 h-3 rounded-full bg-white z-10 shrink-0 mt-[2px]"></div>
                      <div
                        className="w-1 flex-1 my-[-3px] rounded-full"
                        style={{ backgroundColor: result.routeColor }}
                      ></div>
                      <div className="w-3 h-3 rounded-full bg-pacific-400 z-10 shrink-0 mb-[2px]"></div>
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-white/95 font-medium leading-tight">
                        {result.originStop.name}
                      </span>
                      <div className="flex items-center gap-1.5 my-3 py-0.5 text-[9px] uppercase tracking-wider text-white/50 font-bold">
                        <Bus size={10} style={{ color: result.routeColor }} />
                        <span>~{busMin} min de viaje</span>
                      </div>
                      <span className="text-white/95 font-medium leading-tight">
                        {result.destStop.name}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
