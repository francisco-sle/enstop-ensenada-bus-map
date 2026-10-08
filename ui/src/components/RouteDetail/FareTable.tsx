import { Accessibility, GraduationCap, HandHeart, User, type LucideIcon } from 'lucide-react'
import type { DBFareRule } from '../../types'
import { DEFAULT_FARE } from '../../constants/fares'

interface FareTableProps {
  fares: DBFareRule[] | undefined
  isLoading: boolean
}

const PASSENGER_TYPES: Record<string, { label: string; icon: LucideIcon }> = {
  normal: { label: 'General', icon: User },
  student: { label: 'Estudiante', icon: GraduationCap },
  senior: { label: 'Tercera edad', icon: HandHeart },
  disability: { label: 'Discapacidad', icon: Accessibility },
  disability_free: { label: 'Discapacidad (gratuito)', icon: Accessibility },
}

export function FareTable({ fares, isLoading }: FareTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 py-2 select-none">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-paper rounded-3xl shadow-soft p-1.5 select-none">
      <ul className="flex flex-col m-0 p-0 list-none">
        {Object.entries(PASSENGER_TYPES).map(([type, meta]) => {
          const rule = fares?.find((f) => f.passenger_type === type)
          const price = rule
            ? `$${Number(rule.fare_mxn).toFixed(2)}`
            : `$${DEFAULT_FARE.toFixed(2)}*`
          const Icon = meta.icon

          return (
            <li
              key={type}
              className="flex items-center gap-3 px-2.5 py-2 rounded-2xl hover:bg-mist transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-mist text-ink-soft flex items-center justify-center shrink-0">
                <Icon size={15} />
              </span>
              <span className="text-sm font-medium text-ink flex-1">{meta.label}</span>
              <span className="text-sm font-bold text-ink tabular-nums">
                {price} <span className="text-[10px] text-ink-faint font-semibold">MXN</span>
              </span>
            </li>
          )
        })}
      </ul>
      <p className="px-3 pt-1 pb-2 text-[10px] text-ink-faint">
        Tarifas fijas autorizadas por el operador.
      </p>
    </div>
  )
}
