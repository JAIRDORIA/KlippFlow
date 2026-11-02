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
 * Nunca va en la barra inferior.
 */

export type TamanoLogo = 'sm' | 'md' | 'lg'

const PX: Record<TamanoLogo, number> = { sm: 40, md: 72, lg: 104 }

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

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-accent p-[14%] shadow-[var(--shadow-logo)]',
        className,
      )}
      style={{ width: lado, height: lado }}
    >
      <img
        src="/icons/logo-512.png"
        alt={decorativo ? '' : 'KlippFlow'}
        aria-hidden={decorativo || undefined}
        draggable={false}
        decoding="async"
        className="size-full object-contain"
      />
    </span>
  )
}
