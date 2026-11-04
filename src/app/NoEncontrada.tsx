import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Logo } from '@/shared/ui/Logo'
import { sesionVisible } from './sesionVisible'
import { useTituloPagina } from './useTituloPagina'

export interface NoEncontradaProps {
  /** Deja espacio para la barra inferior cuando se muestra dentro de /app. */
  conNav?: boolean
}

const CONTENIDO = {
  barbero: {
    descripcion: 'El enlace puede estar roto o la página cambió de lugar.',
    accion: { texto: 'Ir a Hoy', destino: '/app/hoy' },
  },
  admin: {
    descripcion: 'El enlace puede estar roto o la página cambió de lugar.',
    accion: { texto: 'Ir al panel', destino: '/admin' },
  },
  cliente: {
    descripcion: 'El enlace puede estar roto o la página cambió de lugar.',
    accion: { texto: 'Ir a mi cuenta', destino: '/mi' },
  },
  ninguna: {
    descripcion: 'Pide a tu barbero su link de reservas.',
    accion: { texto: 'Escribir mi código', destino: '/b' },
  },
} as const

/**
 * 404 de la app.
 *
 * El botón depende de la sesión: barbero → Hoy, administrador → panel, sin
 * sesión → explicación neutra. Nunca se menciona `/admin` si no hay sesión de
 * administrador.
 */
export function NoEncontrada({ conNav = false }: NoEncontradaProps) {
  useTituloPagina()

  const sesion = sesionVisible()
  const contenido = CONTENIDO[sesion]

  return (
    <main
      className={cn(
        'screen flex min-h-[calc(100dvh-48px)] flex-col items-center justify-center text-center max-[899px]:min-h-dvh',
        conNav && 'screen-with-nav',
      )}
    >
      <Logo tamano="lg" />

      <p className="type-eyebrow mt-6">ERROR 404</p>
      <h1 className="type-screen-title mt-2">No encontramos esa página</h1>

      <p className="type-small mt-3 max-w-[320px] text-secondary">
        {contenido.descripcion}
      </p>

      <Link
        to={contenido.accion.destino}
        className="kf-press mt-8 inline-flex h-[var(--height-button)] w-full max-w-[320px] items-center justify-center rounded-[var(--radius-button)] bg-accent px-[var(--padding-button-x)] text-[var(--font-size-form)] font-semibold text-ink"
      >
        {contenido.accion.texto}
      </Link>
    </main>
  )
}
