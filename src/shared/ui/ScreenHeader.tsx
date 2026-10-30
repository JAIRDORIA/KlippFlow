import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface ScreenHeaderProps {
  eyebrow: string
  titulo: string
  descripcion?: string
  accion?: ReactNode
  className?: string
}

export function ScreenHeader({
  eyebrow,
  titulo,
  descripcion,
  accion,
  className,
}: ScreenHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <p className="type-eyebrow">{eyebrow}</p>
          <h1 className="type-screen-title">{titulo}</h1>
        </div>
        {accion}
      </div>
      {descripcion && <p className="type-small max-w-prose text-secondary">{descripcion}</p>}
    </header>
  )
}
