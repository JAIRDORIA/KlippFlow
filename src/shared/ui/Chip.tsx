import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export type VarianteChip = 'neutro' | 'hueso' | 'verde' | 'ambar' | 'rojo'

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variante?: VarianteChip
}

const variantes: Record<VarianteChip, string> = {
  neutro: 'border-line bg-white-5 text-secondary',
  hueso: 'border-accent-40 bg-accent-20 text-text',
  verde: 'border-green-30 bg-green-10 text-green',
  ambar: 'border-amber-30 bg-amber-10 text-amber',
  rojo: 'border-red-30 bg-red-10 text-red',
}

export function Chip({ variante = 'neutro', className, children, ...props }: ChipProps) {
  return (
    <span
      {...props}
      className={cn(
        'type-small inline-flex items-center gap-[var(--space-gap-sm)] rounded-[var(--radius-pill)] border px-[var(--padding-chip-x)] py-[var(--padding-chip-y)]',
        variantes[variante],
        className,
      )}
    >
      {children}
    </span>
  )
}
