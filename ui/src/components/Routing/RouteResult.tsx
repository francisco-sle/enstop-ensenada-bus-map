import { useRoutingStore } from '../../store/routingStore'
import { Info, MapPin, Bus, Clock } from 'lucide-react'

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
          const totalMin = Math.round(result.totalMinutes)
          const busMin = Math.round((result.busDistanceKm / 20) * 60)
          const walkMin = Math.round(((result.walkOriginKm + result.walkDestKm) / 5) * 60)

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
              <div className="flex justify-between items-center select-none">
                <div className="flex items-center gap-2 overflow-hidden mr-1">
                  <span
                    style={{ backgroundColor: result.routeColor }}
                    className="text-bay-950 font-extrabold text-[10px] px-2 py-0.5 rounded-sm shrink-0"
                  >
                    {result.routeShortName}
                  </span>
                  <span className="text-xs font-bold text-white/95 truncate">
                    {result.routeName.split('—')[1] || result.routeName}
                  </span>
                </div>
                <div className="shrink-0 flex items-baseline">
                  <span className="text-lg font-extrabold text-pacific-400">
                    ~{totalMin}
                  </span>
                  <span className="text-[10px] text-white/40 ml-0.5">
                    min
                  </span>
                </div>
              </div>

              {/* Time breakdowns */}
              <div className="flex gap-2 text-[10px] text-white/50 border-b border-white/6 pb-2 select-none">
                <span>🚌 ~{busMin} min de microbús</span>
                <span>•</span>
                <span>🚶 ~{walkMin} min a pie</span>
              </div>

              {/* Step-by-Step Directions */}
              {isSelected && (
                <div className="flex flex-col gap-2.5 text-xs pt-1.5 animate-fade-up">
                  {/* Origin walking */}
                  <div className="flex gap-2.5 items-start">
                    <div className="flex flex-col items-center self-stretch w-4">
                      <MapPin size={14} className="text-pacific-400 mt-0.5" />
                      <div className="w-0.5 bg-white/10 flex-1 my-1 min-h-[14px]"></div>
                    </div>
                    <div>
                      <span className="text-white/90">
                        Camina {Math.round(result.walkOriginKm * 1000)}m hasta{' '}
                        <strong className="text-white font-bold">{result.originStop.name}</strong>
                      </span>
                      <span className="text-[10px] text-white/40 block">
                        ~{Math.round(result.walkOriginKm / 5 * 60)} min caminando
                      </span>
                    </div>
                  </div>

                  {/* Bus segment */}
                  <div className="flex gap-2.5 items-start">
                    <div className="flex flex-col items-center self-stretch w-4">
                      <Bus size={14} style={{ color: result.routeColor }} className="mt-0.5" />
                      <div className="w-0.5 bg-white/10 flex-1 my-1 min-h-[14px]"></div>
                    </div>
                    <div>
                      <span className="text-white/90">
                        Sube al microbús en{' '}
                        <strong className="text-white font-bold">{result.originStop.name}</strong>
                      </span>
                      <span className="text-[10px] text-white/40 block">
                        Viaja {result.busDistanceKm.toFixed(1)} km hasta{' '}
                        <strong className="text-white font-bold">{result.destStop.name}</strong> (~{busMin} min)
                      </span>
                    </div>
                  </div>

                  {/* Destination walking */}
                  <div className="flex gap-2.5 items-start">
                    <div className="w-4 flex justify-center">
                      <MapPin size={14} className="text-sol-400 mt-0.5" />
                    </div>
                    <div>
                      <span className="text-white/90">Camina {Math.round(result.walkDestKm * 1000)}m hasta tu destino</span>
                      <span className="text-[10px] text-white/40 block">
                        ~{Math.round(result.walkDestKm / 5 * 60)} min caminando
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Disclaimer */}
      <div className="flex gap-2 items-center bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-[10px] text-amber-300 select-none">
        <Info size={14} className="shrink-0" />
        <span>
          Tiempos estimados de recorrido. El tráfico y el servicio real de las unidades de transporte público de Ensenada pueden variar.
        </span>
      </div>
    </div>
  )
}
