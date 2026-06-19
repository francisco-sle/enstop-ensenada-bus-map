import type { DBFareRule } from '../../types'

interface FareTableProps {
  fares: DBFareRule[] | undefined
  isLoading: boolean
}

export function FareTable({ fares, isLoading }: FareTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 py-2 select-none">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-9 w-full" />
        ))}
      </div>
    )
  }

  // Pre-defined ordered list of passenger types for nice translation and rendering
  const passengerTypesMap = {
    normal: { label: 'General / Normal', icon: '👤' },
    student_highschool: { label: 'Estudiante (Prepa/Uni)', icon: '🎒' },
    student_government: { label: 'Estudiante (Gobierno)', icon: '🏷️' },
    disability: { label: 'Discapacidad / Preferencial', icon: '♿' },
  }

  return (
    <div className="bg-surface-elevated rounded-xl border border-white/8 overflow-hidden mt-2 select-none">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-white/8 text-[10px] uppercase font-bold text-white/50">
            <th className="py-3 px-4">Pasajero</th>
            <th className="py-3 px-4 text-right">Tarifa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">
          {Object.entries(passengerTypesMap).map(([type, meta]) => {
            const rule = fares?.find((f) => f.passenger_type === type)
            const price = rule ? `$${Number(rule.fare_mxn).toFixed(2)}` : '$13.00*'

            return (
              <tr key={type} className="hover:bg-white/2 transition-colors">
                <td className="py-3 px-4 flex items-center gap-2">
                  <span>{meta.icon}</span>
                  <span className="text-sm font-medium text-white/90">{meta.label}</span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-pacific-400 text-sm">
                  {price} <span className="text-[10px] text-white/40 font-normal">MXN</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="px-4 py-2 text-[10px] text-white/40 italic border-t border-white/8">
        * Las tarifas son fijas y autorizadas por el operador.
      </div>
    </div>
  )
}
