import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { RouteDetail } from '../types'
import { RouteThumbnail } from '../components/RouteThumbnail'

interface RoutesPageProps {
  routes: RouteDetail[]
}

export function RoutesPage({ routes }: RoutesPageProps) {
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)

  const brands = Array.from(
    new Map(routes.filter((r) => r.brand).map((r) => [r.brand!.id, r.brand!])).values(),
  )

  const filteredRoutes = selectedBrandId
    ? routes.filter((r) => r.brand?.id === selectedBrandId)
    : routes

  const chipClass = (active: boolean) =>
    `shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-[background-color,color,box-shadow] duration-300 flex items-center gap-2 cursor-pointer active:scale-95 ${
      active ? 'bg-ink text-paper shadow-soft' : 'bg-paper text-ink-soft hover:text-ink shadow-soft'
    }`

  return (
    <div className="h-full overflow-y-auto pb-dock">
      <div className="px-4 pt-6 md:pt-4 pb-8 flex flex-col gap-5 max-w-2xl mx-auto select-none">
        <div className="px-1 animate-enter">
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Rutas</h1>
          <p className="text-ink-soft text-sm mt-1">
            Recorridos y paradas autorizadas del transporte público en Ensenada.
          </p>
        </div>

        {brands.length > 0 && (
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 py-1 [scrollbar-width:none] animate-enter">
            <button
              onClick={() => setSelectedBrandId(null)}
              className={chipClass(selectedBrandId === null)}
            >
              Todas
            </button>
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => setSelectedBrandId(brand.id)}
                className={chipClass(selectedBrandId === brand.id)}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: brand.color_hex }}
                />
                {brand.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {filteredRoutes.map((route, i) => {
            const color = route.brand?.color_hex || route.category?.color_hex || '#3DBFA8'
            return (
              <Link
                key={route.id}
                to={`/routes/${route.id}`}
                style={{ '--i': i } as CSSProperties}
                className="group bg-paper rounded-4xl shadow-soft hover:shadow-lift flex items-center gap-4 p-2.5 pr-4 transition-[box-shadow,translate,scale] duration-300 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer animate-enter stagger"
              >
                <RouteThumbnail
                  geom={route.geom}
                  color={color}
                  className="w-20 h-20 rounded-3xl shrink-0"
                />
                <div className="flex flex-col min-w-0 flex-1 gap-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: color }}
                      className="text-white text-[11px] font-extrabold px-2 py-0.5 rounded-lg shrink-0 [text-shadow:0_1px_1px_rgb(0_0_0/0.3)]"
                    >
                      {route.short_name}
                    </span>
                    <h3 className="text-[15px] font-bold text-ink truncate">
                      {route.name.split('—')[1]?.trim() || route.name}
                    </h3>
                  </div>
                  <p className="text-ink-faint text-xs font-medium truncate">
                    {route.brand ? `${route.brand.name} · ` : ''}
                    {route.route_stops?.length || 0} paradas
                  </p>
                </div>
                <span className="w-9 h-9 rounded-full bg-mist text-ink-soft flex items-center justify-center shrink-0 transition-[background-color,color,translate] duration-300 group-hover:bg-ink group-hover:text-paper group-hover:translate-x-0.5">
                  <ChevronRight size={18} />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
