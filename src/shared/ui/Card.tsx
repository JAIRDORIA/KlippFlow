import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export type VarianteTarjeta = 'estandar' | 'agenda' | 'financiera'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variante?: VarianteTarjeta
  seleccionada?: boolean
}

const variantes: Record<VarianteTarjeta, string> = {
  estandar:
    'rounded-[var(--radius-card)] p-[var(--space-card)] bg-card border border-line',
  agenda:
    'rounded-[var(--radius-card-agenda)] p-[var(--space-card-agenda)] bg-card border border-line',
  financiera:
    'rounded-[var(--radius-card-financial)] p-[var(--space-card-financial)] bg-card border border-line',
}

export function Card({
  variante = 'estandar',
  seleccionada = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        variantes[variante],
        seleccionada && 'border-accent',
        className,
      )}
    >
      {children}
    </div>
  )
}
