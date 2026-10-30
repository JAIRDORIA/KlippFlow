import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ScreenHeader } from '@/shared/ui/ScreenHeader'

export interface NoEncontradaProps {
  conNav?: boolean
}

export function NoEncontrada({ conNav = false }: NoEncontradaProps) {
  return (
    <main className={cn('screen', conNav && 'screen-with-nav')}>
      <ScreenHeader eyebrow="ERROR 404" titulo="Página no encontrada" />
      <EmptyState
        className="mt-7"
        titulo="No encontramos esta página"
        descripcion="El enlace puede estar roto o la página cambió de lugar."
        accion={
          <Link
            to="/"
            className="kf-press inline-flex h-[var(--height-button-compact)] items-center justify-center rounded-[var(--radius-button-card)] bg-accent px-[var(--padding-button-compact-x)] text-[var(--font-size-small)] font-medium text-ink"
          >
            Volver al inicio
          </Link>
        }
      />
    </main>
  )
}
