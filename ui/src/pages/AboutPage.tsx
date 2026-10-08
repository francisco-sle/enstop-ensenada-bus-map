import type { CSSProperties, ReactNode } from 'react'
import { BusFront, HelpCircle, AlertCircle, Ticket, MapPin, BellRing, Palette } from 'lucide-react'
import { LegalLinks } from '../components/Legal/LegalModals'
import { ThemeToggle } from '../components/Theme/ThemeToggle'

function Card({ children, index }: { children: ReactNode; index: number }) {
  return (
    <div
      className="bg-paper rounded-4xl shadow-soft p-5 flex flex-col gap-3 animate-enter stagger"
      style={{ '--i': index } as CSSProperties}
    >
      {children}
    </div>
  )
}

const TIPS = [
  {
    icon: Ticket,
    title: 'Tarifas',
    body: 'El costo normal es de $15.50 MXN. Personas con discapacidad y de la tercera edad pagan $7.75 MXN (50% de descuento) y estudiantes $5.85 MXN al mostrar su credencial. Algunas personas con discapacidad viajan gratis.',
  },
  {
    icon: MapPin,
    title: 'Paradas',
    body: 'Aunque los microbuses a veces se detienen a petición, usa las paradas oficiales para mejorar la seguridad y fluidez vial.',
  },
  {
    icon: BellRing,
    title: 'Bajar del microbús',
    body: 'Pide tu bajada con anticipación diciendo "Bajan en la esquina" o tocando el timbre de la unidad.',
  },
]

export function AboutPage() {
  return (
    <div className="h-full overflow-y-auto flex flex-col select-none pb-dock">
      <div className="px-4 pt-6 md:pt-4 flex flex-col gap-4 max-w-2xl mx-auto w-full flex-1">
        <div className="px-1 mb-1 animate-enter">
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Acerca de ENStop</h1>
          <p className="text-ink-soft text-sm mt-1">
            La guía digital independiente del transporte público de Ensenada, BC.
          </p>
        </div>

        <Card index={0}>
          <h3 className="text-sm font-bold flex items-center gap-2.5 text-ink">
            <span className="w-9 h-9 rounded-2xl bg-accent-tint text-accent flex items-center justify-center">
              <BusFront size={18} />
            </span>
            El proyecto
          </h3>
          <p className="text-sm text-ink-soft leading-relaxed">
            ENStop es una iniciativa comunitaria para mapear digitalmente las rutas de los
            microbuses de Ensenada. Nuestro objetivo es facilitar la movilidad urbana brindando
            información sobre rutas, paradas autorizadas y tarifas oficiales vigentes de forma
            accesible e interactiva.
          </p>
        </Card>

        <Card index={1}>
          <h3 className="text-sm font-bold flex items-center gap-2.5 text-ink">
            <span className="w-9 h-9 rounded-2xl bg-warm-tint text-warm flex items-center justify-center">
              <HelpCircle size={18} />
            </span>
            ¿Cómo viajar en microbús?
          </h3>
          <ul className="flex flex-col gap-3 m-0 p-0 list-none">
            {TIPS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3 bg-mist/70 rounded-3xl p-3.5">
                <Icon size={16} className="text-ink-soft shrink-0 mt-0.5" />
                <p className="text-[13px] text-ink-soft leading-relaxed">
                  <strong className="text-ink font-semibold">{title}.</strong> {body}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <div
          className="bg-warm-tint rounded-4xl p-5 flex gap-3 items-start animate-enter stagger"
          style={{ '--i': 2 } as CSSProperties}
        >
          <AlertCircle size={18} className="text-warm-strong shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-warm-ink">Aviso importante</h3>
            <p className="text-xs leading-relaxed mt-1 text-warm-ink/80">
              Esta es una aplicación independiente y no oficial. Las rutas y tiempos de paso son
              aproximaciones y no representan de forma vinculante los horarios o recorridos
              oficiales de las empresas transportistas de Ensenada o el Ayuntamiento.
            </p>
          </div>
        </div>

        <Card index={3}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-bold flex items-center gap-2.5 text-ink">
              <span className="w-9 h-9 rounded-2xl bg-mist text-ink-soft flex items-center justify-center">
                <Palette size={18} />
              </span>
              Apariencia
            </h3>
            <ThemeToggle variant="inline" />
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="w-full pt-8 flex flex-col items-center gap-2 pb-8">
        <LegalLinks />
        <p className="text-[10px] text-ink-faint font-medium text-center">
          &copy; {new Date().getFullYear()} ENStop. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
