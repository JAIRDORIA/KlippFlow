import { cn } from '@/shared/lib/cn'

export interface BadgeProps {
  cantidad: number
  maximo?: number
  className?: string
}

export function Badge({ cantidad, maximo = 99, className }: BadgeProps) {
  if (!Number.isFinite(cantidad) || cantidad <= 0) return null

  const texto = cantidad > maximo ? `${maximo}+` : String(Math.trunc(cantidad))

  return (
    <span
      aria-label={`${texto} solicitudes pendientes`}
      className={cn(
        'type-badge inline-flex h-[var(--height-badge)] min-w-[var(--height-badge)] items-center justify-center rounded-[var(--radius-pill)] bg-amber px-1 text-ink',
        className,
      )}
    >
      {texto}
    </span>
  )
}
