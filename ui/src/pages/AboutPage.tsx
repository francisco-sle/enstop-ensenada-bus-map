import { Bus, HelpCircle, AlertCircle } from 'lucide-react'

export function AboutPage() {
  return (
    <div className="p-4 h-full overflow-y-auto flex flex-col gap-4 max-w-xl mx-auto select-none animate-fade-up">
      <div>
        <h2 className="text-2xl font-extrabold text-white font-display">Acerca de ENStop</h2>
        <p className="text-muted text-sm mt-1">
          La guía digital independiente del transporte público de Ensenada, BC.
        </p>
      </div>

      {/* Guide Cards */}
      <div className="flex flex-col gap-3">
        {/* Project Info */}
        <div className="bg-surface rounded-xl border border-white/8 p-4 flex flex-col gap-2">
          <h3 className="text-sm font-bold flex items-center gap-2 text-pacific-400">
            <Bus size={18} />
            <span>El Proyecto ENStop</span>
          </h3>
          <p className="text-xs text-white/80 leading-relaxed">
            ENStop es una iniciativa comunitaria para mapear digitalmente las rutas de los
            microbuses de Ensenada. Nuestro objetivo es facilitar la movilidad urbana brindando
            información sobre rutas, paradas autorizadas y tarifas oficiales vigentes de forma
            accesible e interactiva.
          </p>
        </div>

        {/* How to use */}
        <div className="bg-surface rounded-xl border border-white/8 p-4 flex flex-col gap-2">
          <h3 className="text-sm font-bold flex items-center gap-2 text-sol-400">
            <HelpCircle size={18} />
            <span>¿Cómo viajar en microbús?</span>
          </h3>
          <ul className="text-xs text-white/80 leading-relaxed list-disc list-inside flex flex-col gap-2.5">
            <li>
              <strong className="text-white">Tarifas:</strong> El costo normal es de $15.50 MXN.
              Personas con discapacidad y de la tercera edad pagan tarifa preferencial de $7.75 MXN
              (50% de descuento) y estudiantes $5.85 MXN al mostrar su credencial correspondiente.
              Algunas personas con discapacidad tienen acceso gratuito.
            </li>
            <li>
              <strong className="text-white">Paradas:</strong> Aunque los microbuses a veces se
              detienen a petición del usuario, te recomendamos utilizar las paradas oficiales
              señaladas para mejorar la seguridad y fluidez vial.
            </li>
            <li>
              <strong className="text-white">Bajar del autobús:</strong> Solicita tu bajada con
              anticipación diciendo "Bajan en la esquina" o tocando el timbre de la unidad.
            </li>
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 items-start">
          <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-amber-300">Aviso Importante</h3>
            <p className="text-[10px] leading-relaxed mt-1 text-white/80">
              Esta es una aplicación independiente y no oficial. Las rutas y tiempos de paso son
              aproximaciones y no representan de forma vinculante los horarios o recorridos
              oficiales de las empresas transportistas de Ensenada o el Ayuntamiento.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
