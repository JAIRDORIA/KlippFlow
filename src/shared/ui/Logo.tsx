import { useState } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Logo de KlippFlow.
 *
 * El logo real es casi negro con bordes plateados y se perdería sobre el fondo
 * de la app, así que siempre se muestra dentro de una baldosa redonda hueso
 * (`--accent`) con padding interno. El archivo es `public/icons/logo-512.png`
 * (491×512); con `lg` (104 px) sobra nitidez incluso en pantallas de 3×, por eso
 * no se usa el de 1024.
 *
 * Reglas que no se deben romper:
 * - `src` siempre absoluto (`/icons/...`). Una ruta relativa se resolvería
 *   contra la ruta actual (`/b/CODIGO/icons/...`) y daría 404.
 * - El relleno se calcula en px a partir del lado del logo. Un padding en
 *   porcentaje se resuelve contra el ancho del contenedor, no del logo: en
 *   `/b/:codigo` dejaba la imagen en 0×0 y la baldosa se veía vacía.
 * - Si la imagen falla, se muestra un monograma sobre la misma baldosa.
 *
 * Nunca va en la barra inferior.
 */

export type TamanoLogo = 'sm' | 'md' | 'lg'

const PX: Record<TamanoLogo, number> = { sm: 40, md: 72, lg: 104 }

/** Relleno interno de la baldosa como fracción del lado del logo. */
const PROPORCION_RELLENO = 0.14

/** Monograma de respaldo, con tamaños de la escala tipográfica. */
const CLASE_MONOGRAMA: Record<TamanoLogo, string> = {
  sm: 'text-[var(--font-size-small)]',
  md: 'text-[var(--font-size-card-title)]',
  lg: 'text-[var(--font-size-screen-title)]',
}

/** Ruta absoluta: funciona en /b/X, /cita/X, /app/* y /admin/*. */
const RUTA_LOGO = '/icons/logo-512.png'

export interface LogoProps {
  tamano?: TamanoLogo
  /**
   * `true` cuando el nombre "KlippFlow" ya aparece al lado (login, marca):
   * el logo pasa a ser decorativo para no repetirlo en el lector de pantalla.
   */
  decorativo?: boolean
  className?: string
}

export function Logo({ tamano = 'md', decorativo = false, className }: LogoProps) {
  const lado = PX[tamano]
  const relleno = Math.round(lado * PROPORCION_RELLENO * 100) / 100
  const [fallo, setFallo] = useState(false)

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-accent shadow-[var(--shadow-logo)]',
        className,
      )}
      style={{ width: lado, height: lado, padding: relleno }}
    >
      {fallo ? (
        <span
          role={decorativo ? undefined : 'img'}
          aria-hidden={decorativo || undefined}
          aria-label={decorativo ? undefined : 'KlippFlow'}
          className={cn('font-semibold text-ink', CLASE_MONOGRAMA[tamano])}
        >
          K
        </span>
      ) : (
        <img
          src={RUTA_LOGO}
          alt={decorativo ? '' : 'KlippFlow'}
          aria-hidden={decorativo || undefined}
          width={lado}
          height={lado}
          draggable={false}
          decoding="async"
          onError={() => setFallo(true)}
          className="size-full object-contain"
        />
      )}
    </span>
  )
}
