import type { CSSProperties } from 'react'
import { useRoutingStore } from '../../store/routingStore'
import { BusFront } from 'lucide-react'

export function RouteResult() {
  const { routingResults, selectedResultIndex, setSelectedResultIndex } = useRoutingStore()

  if (routingResults.length === 0) return null

  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-faint px-1 select-none">
        Rutas recomendadas
      </h3>

      <div className="flex flex-col gap-2">
        {routingResults.map((result, index) => {
          const isSelected = selectedResultIndex === index
          const busMin = Math.round((result.busDistanceKm / 20) * 60)

          return (
            <button
              type="button"
              key={index}
              onClick={() => setSelectedResultIndex(index)}
              style={{ '--i': index } as CSSProperties}
              className={`text-left p-3.5 rounded-3xl cursor-pointer flex flex-col transition-[background-color,box-shadow,scale] duration-300 active:scale-[0.985] animate-enter stagger ${
                isSelected
                  ? 'bg-paper shadow-soft ring-2 ring-pacific-500'
                  : 'bg-mist/70 hover:bg-mist ring-1 ring-transparent'
              }`}
            >
              {/* Badge & Time Summary */}
              <div className="flex justify-between items-center gap-3 select-none">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-10 h-10 rounded-2xl text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-soft [text-shadow:0_1px_1px_rgb(0_0_0/0.35)]"
                    style={{ backgroundColor: result.routeColor }}
                  >
                    {result.routeShortName}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-ink truncate">
                      {result.routeName.split('—')[1] || result.routeName}
                    </span>
                    {result.routeBrandName && (
                      <span className="text-[11px] text-ink-faint truncate font-medium">
                        {result.routeBrandName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-baseline gap-0.5">
                  <span className="text-lg font-extrabold text-ink tabular-nums">{busMin}</span>
                  <span className="text-[11px] text-ink-faint font-semibold">min</span>
                </div>
              </div>

              {/* Step-by-Step Directions */}
              <div
                className={`grid transition-all duration-500 ${
                  isSelected ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0'
                }`}
                style={{ transitionTimingFunction: 'var(--ease-out-soft)' }}
              >
                <div className="overflow-hidden">
                  <div className="flex gap-3 text-xs pl-3.5 pt-1">
                    <div className="flex flex-col items-center w-3 shrink-0 py-1">
                      <span className="w-3 h-3 rounded-full border-[3px] border-pacific-500 bg-paper shrink-0" />
                      <span
                        className="w-[3px] flex-1 my-1 rounded-full opacity-70"
                        style={{ backgroundColor: result.routeColor }}
                      />
                      <span className="w-3 h-3 rounded-full bg-sol-500 shrink-0" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0 gap-2.5">
                      <span className="text-ink font-semibold leading-tight">
                        {result.originStop.name}
                      </span>
                      <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
                        <BusFront size={12} style={{ color: result.routeColor }} />
                        {busMin} min en microbús
                      </span>
                      <span className="text-ink font-semibold leading-tight">
                        {result.destStop.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
