import { Link, Navigate } from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useCitasCliente } from './hooks'
import { TarjetaCitaCliente } from './components/TarjetaCitaCliente'

export function MiCitasPage() {
  useTituloPagina()
  const { usuario } = useAuth()
  const citas = useCitasCliente()

  if (!usuario || usuario.tipo !== 'cliente') {
    if (usuario?.tipo === 'barbero') return <Navigate to="/app" replace />
    return <Navigate to="/login?volver=%2Fmi%2Fcitas" replace />
  }

  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-8">
        <header className="flex flex-col gap-4">
          <Link
            to="/mi"
            className="type-helper inline-flex min-h-[var(--height-button-compact)] items-center text-secondary hover:text-text"
          >
            Volver a mi cuenta
          </Link>
          <h1 className="type-public-title">Mis citas</h1>
          <p className="type-form text-secondary">
            Revisa el estado de cada solicitud y sus servicios.
          </p>
        </header>

        {citas.isPending ? (
          <div className="flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : citas.isError ? (
          <EmptyState
            titulo="No pudimos cargar tus citas"
            descripcion="Revisa tu conexión e inténtalo de nuevo."
            accion={
              <Button tamano="compacto" onClick={() => void citas.refetch()}>
                Reintentar
              </Button>
            }
          />
        ) : citas.data.length === 0 ? (
          <EmptyState
            titulo="Aún no tienes citas"
            descripcion="Reserva con un barbero desde Mis barberos."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {citas.data.map((cita) => (
              <li key={cita.id}>
                <TarjetaCitaCliente cita={cita} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
