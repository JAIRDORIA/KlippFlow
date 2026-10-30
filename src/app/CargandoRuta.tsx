import { Spinner } from '@/shared/ui/Spinner'

export function CargandoRuta() {
  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] items-center justify-center max-[899px]:min-h-dvh">
      <Spinner tamano={24} etiqueta="Cargando" />
    </main>
  )
}
