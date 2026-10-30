import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Spinner } from './Spinner'

export type VarianteBoton = 'primary' | 'ghost' | 'danger'
export type TamanoBoton = 'estandar' | 'compacto'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton
  tamano?: TamanoBoton
  cargando?: boolean
  icono?: ReactNode
}

const variantes: Record<VarianteBoton, string> = {
  primary: 'bg-accent text-ink hover:bg-white',
  ghost: 'bg-transparent text-text hover:bg-white-5',
  danger: 'bg-transparent text-red border border-red-40 hover:bg-red-10',
}

const tamanos: Record<TamanoBoton, string> = {
  estandar:
    'h-[var(--height-button)] rounded-[var(--radius-button)] px-[var(--padding-button-x)] text-[var(--font-size-form)] font-semibold',
  compacto:
    'h-[var(--height-button-compact)] rounded-[var(--radius-button-card)] px-[var(--padding-button-compact-x)] text-[var(--font-size-small)] font-medium',
}

export function Button({
  variante = 'primary',
  tamano = 'estandar',
  cargando = false,
  icono,
  className,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const deshabilitado = disabled === true || cargando

  return (
    <button
      {...props}
      type={type}
      disabled={deshabilitado}
      aria-busy={cargando || undefined}
      className={cn(
        'kf-press inline-flex min-h-[var(--height-button-compact)] items-center justify-center gap-[var(--space-gap-sm)] whitespace-nowrap',
        'disabled:opacity-35 disabled:pointer-events-none',
        variantes[variante],
        tamanos[tamano],
        className,
      )}
    >
      {cargando ? <Spinner tamano={18} etiqueta="Procesando" /> : icono}
      {children}
    </button>
  )
}
