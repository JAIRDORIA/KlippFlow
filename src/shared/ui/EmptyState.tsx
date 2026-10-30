import { CircleDashed } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface EmptyStateProps {
  titulo: string
  descripcion?: string
  icono?: ReactNode
  accion?: ReactNode
  className?: string
}

export function EmptyState({
  titulo,
  descripcion,
  icono,
  accion,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-10 text-center',
        className,
      )}
    >
      <span className="text-dim">
        {icono ?? <CircleDashed aria-hidden="true" size={28} strokeWidth={1.6} />}
      </span>
      <p className="type-card-title">{titulo}</p>
      {descripcion && <p className="type-small max-w-sm text-secondary">{descripcion}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  )
}
