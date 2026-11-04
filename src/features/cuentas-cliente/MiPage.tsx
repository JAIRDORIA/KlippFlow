import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Logo } from '@/shared/ui/Logo'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useBarberosCliente, useCitasCliente, usePerfilCliente } from './hooks'

export function MiPage() {
  const { usuario, nombre, cerrarSesion } = useAuth()
  useTituloPagina()
  const navegar = useNavigate()
  const perfil = usePerfilCliente()
  const barberos = useBarberosCliente()
  const citas = useCitasCliente()

  if (!usuario || usuario.tipo !== 'cliente') {
    if (usuario?.tipo === 'barbero') return <Navigate to="/app" replace />
    return <Navigate to="/login?volver=%2Fmi" replace />
  }

  const nombreVisible = perfil.data?.nombre ?? nombre ?? usuario.nombre
  const pendiente = citas.data?.find((cita) => cita.estado === 'pendiente')

  async function salir() {
    await cerrarSesion()
    navegar('/login', { replace: true })
  }

  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-8">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <Logo tamano="sm" />
            <Button
              variante="ghost"
              tamano="compacto"
              onClick={() => void salir()}
            >
              Cerrar sesión
            </Button>
          </div>
          <div>
            <h1 className="type-public-title break-words">
              Hola, {nombreVisible}
            </h1>
            <p className="type-form mt-3 text-secondary">
              Estas son las barberías con las que puedes reservar.
            </p>
          </div>
        </header>

        {pendiente && (
          <p
            role="status"
            className="type-small rounded-[var(--radius-warning)] border border-amber-30 bg-amber-10 p-[var(--space-warning)] text-amber"
          >
            Tienes una solicitud pendiente. Espera la respuesta del barbero.
          </p>
        )}

        <section aria-labelledby="mis-barberos" className="flex flex-col gap-4">
          <h2 id="mis-barberos" className="type-eyebrow">
            MIS BARBEROS
          </h2>

          {barberos.isPending ? (
            <div className="flex flex-col gap-3" aria-hidden="true">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : barberos.isError ? (
            <EmptyState
              titulo="No pudimos cargar tus barberos"
              descripcion="Inténtalo de nuevo."
              accion={
                <Button
                  tamano="compacto"
                  onClick={() => void barberos.refetch()}
                >
                  Reintentar
                </Button>
              }
            />
          ) : barberos.data.length === 0 ? (
            <EmptyState titulo="Aún no has reservado con ningún barbero. Abre el link que te dio tu barbero." />
          ) : (
            <ul className="flex flex-col gap-3">
              {barberos.data.map((barbero) => {
                const titulo = barbero.nombreBarberia
                  ? `${barbero.nombre} · ${barbero.nombreBarberia}`
                  : barbero.nombre

                return (
                  <li key={barbero.codigo}>
                    <Card className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="type-card-title break-words">{titulo}</p>
                        <p className="type-helper">{barbero.codigo}</p>
                      </div>
                      {barbero.reservasDisponibles ? (
                        <Link
                          to={`/b/${encodeURIComponent(barbero.codigo)}`}
                          className="inline-flex h-[var(--height-button-compact)] shrink-0 items-center justify-center rounded-[var(--radius-button-card)] bg-accent px-[var(--padding-button-compact-x)] text-[var(--font-size-small)] font-medium text-ink transition-colors hover:bg-white"
                        >
                          Reservar
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-[var(--height-button-compact)] shrink-0 items-center justify-center rounded-[var(--radius-button-card)] border border-line px-[var(--padding-button-compact-x)] text-[var(--font-size-small)] font-medium text-secondary opacity-[var(--opacity-disabled)]"
                        >
                          Reservar
                        </button>
                      )}
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
