import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import {
  CORREO_CONTACTO,
  FECHA_ACTUALIZACION,
  RESPONSABLE,
  URL_SITIO,
} from '@/config/legal'

function Seccion({
  titulo,
  children,
}: {
  titulo: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="type-card-title">{titulo}</h2>
      {children}
    </section>
  )
}

export function PrivacidadPage() {
  useTituloPagina()

  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[65ch] flex-col gap-8">
        <header className="flex flex-col gap-4">
          <Link
            to="/login"
            className="type-helper inline-flex min-h-[var(--height-button-compact)] items-center text-secondary underline underline-offset-2 hover:text-text"
          >
            Volver
          </Link>
          <div>
            <p className="type-eyebrow">LEGAL</p>
            <h1 className="type-public-title mt-2">
              Política de privacidad de KlippFlow
            </h1>
            <p className="type-small mt-3 text-secondary">
              Última actualización: {FECHA_ACTUALIZACION}
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-8">
          <Seccion titulo="Quién es el responsable">
            <p className="type-form text-secondary">
              El responsable del tratamiento es {RESPONSABLE}. Puedes
              contactarlo en{' '}
              <a
                href={`mailto:${CORREO_CONTACTO}`}
                className="underline underline-offset-2 hover:text-text"
              >
                {CORREO_CONTACTO}
              </a>
              .
            </p>
            <p className="type-form text-secondary">
              KlippFlow es una herramienta para que barberos gestionen sus
              citas. El sitio está disponible en{' '}
              <a
                href={URL_SITIO}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-text"
              >
                {URL_SITIO}
              </a>
              .
            </p>
          </Seccion>

          <Seccion titulo="Qué datos recogemos de los clientes">
            <ul className="type-form flex list-disc flex-col gap-2 pl-5 text-secondary">
              <li>
                <span className="text-text">Datos de tu cuenta:</span> nombre,
                usuario, contraseña guardada de forma cifrada mediante un hash
                seguro, correo y nombre de tu cuenta de Google, y celular.
              </li>
              <li>
                <span className="text-text">Tus citas:</span> fecha y hora,
                barbero, servicios y personas, estado, valor y motivos. Tu
                nombre, celular y correo se copian a la cita para que el barbero
                pueda identificarte y contactarte.
              </li>
              <li>
                <span className="text-text">Passkeys:</span> clave pública,
                identificador técnico de la credencial, nombre, tipo de
                dispositivo, si está respaldada y fechas de creación y último
                uso. Tu huella, rostro o PIN nunca salen de tu teléfono: no los
                recibimos ni los almacenamos. De la passkey guardamos una clave
                pública y los datos técnicos de la credencial.
              </li>
              <li>
                <span className="text-text">Notificaciones:</span> el
                identificador técnico de la suscripción de tu navegador
                (endpoint) y las claves técnicas necesarias para enviarte
                avisos.
              </li>
            </ul>
          </Seccion>

          <Seccion titulo="Para qué los usamos">
            <ul className="type-form flex list-disc flex-col gap-2 pl-5 text-secondary">
              <li>Crear y proteger tu cuenta.</li>
              <li>Gestionar tus solicitudes de cita.</li>
              <li>
                Que el barbero te identifique y te contacte por tu cita usando
                tu nombre y celular.
              </li>
              <li>Enviarte avisos sobre el estado de tu cita.</li>
              <li>Seguridad y prevención de abuso.</li>
            </ul>
          </Seccion>

          <Seccion titulo="Con quién se comparten">
            <p className="type-form text-secondary">
              Compartimos lo necesario con el barbero con quien reservas
              (nombre y celular de tu cita) y con proveedores que operan la
              plataforma: Google para el inicio de sesión, Vercel para el
              sitio, Clever Cloud para la base de datos y el servicio de
              notificaciones de tu navegador. No vendemos tus datos.
            </p>
          </Seccion>

          <Seccion titulo="Tus derechos">
            <p className="type-form text-secondary">
              De acuerdo con la Ley 1581 de 2012, tienes derecho a:
            </p>
            <ul className="type-form flex list-disc flex-col gap-2 pl-5 text-secondary">
              <li>Conocer, actualizar y rectificar tus datos.</li>
              <li>Solicitar prueba de la autorización.</li>
              <li>Ser informado sobre el uso que se da a tus datos.</li>
              <li>
                Presentar quejas ante la Superintendencia de Industria y
                Comercio.
              </li>
              <li>Revocar la autorización.</li>
              <li>Solicitar la supresión de tus datos.</li>
              <li>Acceder gratis a ellos.</li>
            </ul>
          </Seccion>

          <Seccion titulo="Cómo ejercerlos">
            <p className="type-form text-secondary">
              Escríbenos a{' '}
              <a
                href={`mailto:${CORREO_CONTACTO}`}
                className="underline underline-offset-2 hover:text-text"
              >
                {CORREO_CONTACTO}
              </a>
              . Respondemos las consultas en un máximo de 10 días hábiles y los
              reclamos en un máximo de 15 días hábiles.
            </p>
          </Seccion>

          <Seccion titulo="Conservación">
            <p className="type-form text-secondary">
              Conservamos tus datos mientras mantengas tu cuenta y sean
              necesarios para prestarte el servicio. Para solicitar la
              supresión, escribe a {CORREO_CONTACTO}; atenderemos la solicitud
              por ese canal. Algunos registros de citas podrán conservarse
              cuando el barbero los necesite para su contabilidad o exista otra
              obligación legal.
            </p>
          </Seccion>

          <Seccion titulo="Seguridad">
            <p className="type-form text-secondary">
              Usamos medidas técnicas y organizativas razonables para proteger
              tus datos, como conexiones cifradas, control de acceso y resguardo
              de credenciales. Ningún sistema es completamente infalible, pero
              trabajamos para reducir los riesgos.
            </p>
          </Seccion>

          <Seccion titulo="Menores de edad">
            <p className="type-form text-secondary">
              Este servicio está dirigido a personas mayores de edad.
            </p>
          </Seccion>

          <Seccion titulo="Cambios a la política">
            <p className="type-form text-secondary">
              Si cambiamos esta política, publicaremos la nueva versión en esta
              misma página con una fecha de actualización distinta.
            </p>
          </Seccion>

          <footer className="border-t border-line pt-6">
            <p className="type-helper text-secondary">
              Última actualización: {FECHA_ACTUALIZACION}
            </p>
          </footer>
        </div>
      </div>
    </main>
  )
}
