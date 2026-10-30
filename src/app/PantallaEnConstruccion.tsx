import { cn } from '@/shared/lib/cn'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ScreenHeader } from '@/shared/ui/ScreenHeader'

export interface PantallaEnConstruccionProps {
  eyebrow: string
  titulo: string
  conNav?: boolean
}

/** Marcador de posición para las pantallas que se implementan en prompts posteriores. */
export function PantallaEnConstruccion({
  eyebrow,
  titulo,
  conNav = false,
}: PantallaEnConstruccionProps) {
  return (
    <main className={cn('screen', conNav && 'screen-with-nav')}>
      <ScreenHeader eyebrow={eyebrow} titulo={titulo} />
      <EmptyState
        className="mt-7"
        titulo="En construcción"
        descripcion="Esta pantalla se implementará en el siguiente prompt."
      />
    </main>
  )
}
