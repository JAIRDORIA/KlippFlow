import { cn } from '@/shared/lib/cn'

/**
 * LOGO PROVISIONAL.
 *
 * Reemplazar por el archivo definitivo en `public/logo-klippflow.svg` (o el PNG
 * que entregue diseño) y cambiar este componente por un <img> con esa ruta.
 * Mientras no exista el logo real se usa el círculo --ink con la "K" --accent.
 */
export interface LogoKlippFlowProps {
  className?: string
  /** Tamaño en px. Sin valor usa --size-logo (210 px). */
  tamano?: number
}

export function LogoKlippFlow({ className, tamano }: LogoKlippFlowProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-ink text-accent shadow-[var(--shadow-logo)]',
        tamano === undefined && 'size-[var(--size-logo)]',
        className,
      )}
      style={{
        width: tamano,
        height: tamano,
        fontSize: tamano === undefined ? 'calc(var(--size-logo) * 0.46)' : tamano * 0.46,
      }}
    >
      <span className="font-semibold leading-none">K</span>
    </span>
  )
}
