import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ShieldCheck, Scale, FileText } from 'lucide-react'

type ModalType = 'terms' | 'privacy' | 'license' | null

export function LegalLinks() {
  const [activeModal, setActiveModal] = useState<ModalType>(null)

  return (
    <>
      <div className="flex items-center gap-1 text-[11px] text-ink-faint font-medium select-none">
        <button
          onClick={() => setActiveModal('terms')}
          className="hover:text-ink hover:bg-mist px-2 py-1 rounded-full transition-colors cursor-pointer"
        >
          Términos
        </button>
        <span className="text-line">•</span>
        <button
          onClick={() => setActiveModal('privacy')}
          className="hover:text-ink hover:bg-mist px-2 py-1 rounded-full transition-colors cursor-pointer"
        >
          Privacidad
        </button>
        <span className="text-line">•</span>
        <button
          onClick={() => setActiveModal('license')}
          className="hover:text-ink hover:bg-mist px-2 py-1 rounded-full transition-colors cursor-pointer"
        >
          Licencia
        </button>
      </div>

      {activeModal && <LegalModal type={activeModal} onClose={() => setActiveModal(null)} />}
    </>
  )
}

function LegalModal({
  type,
  onClose,
}: {
  type: 'terms' | 'privacy' | 'license'
  onClose: () => void
}) {
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => setIsClosing(true)

  const content = {
    terms: {
      title: 'Términos de Servicio',
      icon: <FileText size={20} className="text-warm" />,
      body: (
        <div className="flex flex-col gap-5 text-[13px] text-ink-soft leading-relaxed">
          <p className="text-ink-faint font-medium">Última actualización: 2026</p>
          <p>
            Bienvenido a ENSTOP. Al utilizar nuestra aplicación, aceptas los siguientes términos de
            servicio.
          </p>

          <div>
            <h3 className="text-ink font-bold mb-1">1. Naturaleza del Servicio</h3>
            <p>
              ENSTOP es una herramienta gratuita creada para ayudar a los ciudadanos de Ensenada a
              buscar rutas de transporte público, paradas y tiempos estimados. La aplicación es de
              uso público y gratuito.
            </p>
          </div>

          <div>
            <h3 className="text-ink font-bold mb-1">2. Monetización y Publicidad</h3>
            <p>
              Tenemos la intención de monetizar la plataforma en el futuro a través de
              patrocinadores y anuncios pagados. Sin embargo, esto{' '}
              <strong>no afectará a los usuarios</strong>: la herramienta principal de búsqueda de
              rutas seguirá siendo siempre gratuita.
            </p>
          </div>

          <div>
            <h3 className="text-ink font-bold mb-1">3. Independencia y No Afiliación</h3>
            <p>
              El proyecto ENSTOP es una iniciativa independiente. No estamos relacionados con ningún
              partido político, gobierno municipal, estatal o concesionarios de transporte público.
              Nuestra identidad y marca están protegidas.
            </p>
          </div>

          <div>
            <h3 className="text-ink font-bold mb-1">4. Propiedad Intelectual</h3>
            <p>
              Todos los datos relacionados con las rutas, paradas, tiempos estimados y los
              algoritmos utilizados son propiedad exclusiva de ENSTOP. Queda estrictamente prohibido
              su uso, extracción, o integración en aplicaciones de terceros sin nuestra autorización
              expresa, de acuerdo con nuestra Licencia.
            </p>
          </div>

          <div>
            <h3 className="text-ink font-bold mb-1">5. Exención de Responsabilidad</h3>
            <p>
              Los tiempos y rutas proporcionados son estimaciones y pueden variar debido al tráfico
              o decisiones de los operadores. ENSTOP se proporciona "tal cual" y no nos hacemos
              responsables por demoras derivadas del uso de la aplicación.
            </p>
          </div>
        </div>
      ),
    },
    privacy: {
      title: 'Política de Privacidad',
      icon: <ShieldCheck size={20} className="text-success" />,
      body: (
        <div className="flex flex-col gap-5 text-[13px] text-ink-soft leading-relaxed">
          <p className="text-ink-faint font-medium">Última actualización: 2026</p>
          <p>
            En ENSTOP valoramos tu privacidad. Esta política explica cómo manejamos la información
            cuando utilizas nuestra aplicación.
          </p>

          <div>
            <h3 className="text-ink font-bold mb-1">1. No Recopilación de Datos Personales</h3>
            <p>
              ENSTOP <strong>no</strong> recopila ningún tipo de Información de Identificación
              Personal (PII, por sus siglas en inglés) como nombres, correos electrónicos, o números
              de teléfono de sus usuarios para la funcionalidad principal de rutas.
            </p>
          </div>

          <div>
            <h3 className="text-ink font-bold mb-1">2. Datos de Ubicación</h3>
            <p>
              Para ofrecer recomendaciones precisas de rutas desde tu ubicación actual, ENSTOP puede
              solicitar acceso al GPS de tu dispositivo.
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>
                Esta información de ubicación en vivo{' '}
                <strong>no se recopila, almacena, ni envía a nuestros servidores</strong>.
              </li>
              <li>
                El procesamiento de la ubicación para calcular distancias a paradas se realiza de
                manera <strong>local</strong> en tu dispositivo.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-ink font-bold mb-1">3. Uso de Cookies y Almacenamiento Local</h3>
            <p>
              Podemos utilizar el almacenamiento local de tu navegador o parámetros en la URL para
              guardar tus preferencias, últimas búsquedas de rutas o el estado de la interfaz. Esto
              es únicamente para mejorar tu experiencia de usuario.
            </p>
          </div>

          <div>
            <h3 className="text-ink font-bold mb-1">4. Cambios Futuros</h3>
            <p>
              Si en el futuro se implementan funcionalidades más robustas, como seguimiento de
              autobuses en vivo o cuentas de usuario, esta política de privacidad será actualizada y
              se solicitará el consentimiento correspondiente a los usuarios.
            </p>
          </div>
        </div>
      ),
    },
    license: {
      title: 'Licencia y Derechos de Autor',
      icon: <Scale size={20} className="text-accent" />,
      body: (
        <div className="flex flex-col gap-5 text-[13px] text-ink-soft leading-relaxed">
          <p className="text-ink font-semibold bg-mist p-3.5 rounded-2xl">
            Copyright (c) 2026 ENSTOP. Todos los derechos reservados.
          </p>
          <p>
            Esta es una licencia propietaria y de código fuente disponible para la aplicación, datos
            y algoritmos de ENSTOP.
          </p>

          <div>
            <h3 className="text-ink font-bold mb-1">1. Gratuito para Usuarios Finales</h3>
            <p>
              La aplicación ENSTOP es gratuita para el uso público de los usuarios finales. Te
              animamos a utilizar la aplicación para buscar rutas, ver paradas de autobús y
              planificar tus viajes.
            </p>
          </div>

          <div>
            <h3 className="text-ink font-bold mb-1">2. Acceso al Código Fuente</h3>
            <p>
              El código fuente de esta aplicación está disponible públicamente por motivos de
              transparencia y educación. Puedes ver y estudiar el código en el repositorio público.
            </p>
          </div>

          <div>
            <h3 className="text-ink font-bold mb-1">3. Restricciones de Uso Comercial</h3>
            <p>
              Esta <strong>NO</strong> es una licencia de Código Abierto (Open Source). Las
              siguientes acciones están estrictamente prohibidas sin el permiso previo de los
              titulares:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>
                <strong>Uso Comercial:</strong> No puedes utilizar el código fuente, los algoritmos
                ni ningún dato proporcionado para fines comerciales.
              </li>
              <li>
                <strong>Extracción de Datos y Uso de API:</strong> No puedes extraer (scraping),
                recolectar o reutilizar las rutas de autobús, datos de paradas, horarios o el grafo
                de enrutamiento para su uso en cualquier aplicación de terceros.
              </li>
              <li>
                <strong>Obras Derivadas:</strong> No puedes copiar, modificar, distribuir o crear
                obras derivadas de los algoritmos de enrutamiento o la estructura de datos.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-ink font-bold mb-1">4. Sin Afiliación</h3>
            <p>
              ENSTOP es un proyecto independiente creado para ayudar a la comunidad de Ensenada. No
              está afiliado ni respaldado por ningún partido político, entidad gubernamental o
              concesionarios de transporte.
            </p>
          </div>

          <div>
            <h3 className="text-ink font-bold mb-1">5. Limitación de Responsabilidad</h3>
            <p className="text-[11px] uppercase tracking-wider text-ink-faint">
              EL SOFTWARE Y LOS DATOS SE PROPORCIONAN "TAL CUAL", SIN GARANTÍA DE NINGÚN TIPO. EN
              NINGÚN CASO LOS AUTORES SERÁN RESPONSABLES DE NINGUNA RECLAMACIÓN O DAÑOS DERIVADOS
              DEL USO DEL SOFTWARE.
            </p>
          </div>
        </div>
      ),
    },
  }[type]

  return createPortal(
    <div
      className={`fixed inset-0 z-[2000] flex items-end md:items-center justify-center md:p-4 bg-ink/30 backdrop-blur-sm select-text ${
        isClosing ? 'animate-[fade-in_200ms_reverse_forwards]' : 'animate-fade-in'
      }`}
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        onAnimationEnd={(e) => {
          if (isClosing && e.target === e.currentTarget) onClose()
        }}
        className={`bg-paper shadow-float w-full md:max-w-md max-h-[85vh] flex flex-col overflow-hidden rounded-t-4xl md:rounded-4xl ${
          isClosing ? 'animate-sheet-out md:animate-exit' : 'animate-sheet-in md:animate-scale-in'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-mist flex items-center justify-center">
              {content.icon}
            </span>
            <h2 id="legal-modal-title" className="text-base font-bold text-ink">
              {content.title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-full bg-mist text-ink-soft hover:text-ink flex items-center justify-center transition-colors cursor-pointer active:scale-90"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pb-6 pt-2 overflow-y-auto min-h-0 flex-1">{content.body}</div>
      </div>
    </div>,
    document.body,
  )
}
