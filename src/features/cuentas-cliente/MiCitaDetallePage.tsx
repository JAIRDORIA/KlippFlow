import { Link, Navigate, useParams } from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import { useAuth } from '@/features/auth/useAuth'
import { ErrorPeticion } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Chip } from '@/shared/ui/Chip'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Money } from '@/shared/ui/Money'
import { Skeleton } from '@/shared/ui/Skeleton'
import {
  etiquetaEstadoCita,
  fechaCitaLegible,
  horaCitaLegible,
  mensajeEstadoCita,
  motivoCancelacionLegible,
  motivoRechazoLegible,
  varianteEstadoCita,
} from './domain/citas'
import { useCitaCliente } from './hooks'

export function MiCitaDetallePage() {
  useTituloPagina()
  const { usuario } = useAuth()
  const { id: parametro = '' } = useParams()
  const id = Number(parametro)
  const idValido = Number.isInteger(id) && id > 0
  const consulta = useCitaCliente(id, idValido)

  if (!usuario || usuario.tipo !== 'cliente') {
    if (usuario?.tipo === 'barbero') return <Navigate to="/app" replace />
    return <Navigate to="/login?volver=%2Fmi%2Fcitas" replace />
  }

  const noEncontrada =
    !idValido ||
    (consulta.error instanceof ErrorPeticion && consulta.error.status === 404)

  if (noEncontrada) return <CitaNoEncontrada />

  if (consulta.isPending) return <DetalleCargando />

  if (consulta.isError) {
    return (
      <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
        <div className="mx-auto flex w-full max-w-[520px] flex-col">
          <EmptyState
            titulo="No pudimos cargar la cita"
            descripcion="Revisa tu conexión e inténtalo de nuevo."
            accion={
              <Button tamano="compacto" onClick={() => void consulta.refetch()}>
                Reintentar
              </Button>
            }
          />
        </div>
      </main>
    )
  }

  const cita = consulta.data
  const barberia = cita.barbero.nombreBarberia ?? cita.barbero.nombre
  const motivoRechazo = motivoRechazoLegible(cita.motivos.motivoRechazo)
  const motivoCancelacion = motivoCancelacionLegible(cita.motivos.motivoCancelacion)

  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-8">
        <header className="flex flex-col gap-4">
          <Link
            to="/mi/citas"
            className="type-helper inline-flex min-h-[var(--height-button-compact)] items-center text-secondary hover:text-text"
          >
            Volver a mis citas
          </Link>
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <h1 className="type-public-title break-words">{barberia}</h1>
              <Chip variante={varianteEstadoCita(cita.estado)}>
                {etiquetaEstadoCita(cita.estado)}
              </Chip>
            </div>
            <p className="type-form text-secondary">
              {mensajeEstadoCita(cita.estado, cita.motivos)}
            </p>
          </div>
        </header>

        <Card className="flex flex-col gap-3">
          <p className="type-eyebrow">TU CITA</p>
          <div className="flex items-baseline justify-between gap-3">
            <span className="type-small text-secondary">Fecha</span>
            <span className="type-form text-text">{fechaCitaLegible(cita.fecha)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="type-small text-secondary">Hora</span>
            <span className="type-form font-mono text-text">
              {horaCitaLegible(cita.horaInicio)} – {horaCitaLegible(cita.horaFin)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="type-small text-secondary">Barbero</span>
            <span className="type-form text-right text-text">{cita.barbero.nombre}</span>
          </div>
        </Card>

        {(motivoRechazo || motivoCancelacion) && (
          <Card className="flex flex-col gap-2 border-amber-30">
            <p className="type-eyebrow text-amber">MOTIVO</p>
            <p className="type-small text-amber">
              {motivoRechazo ?? motivoCancelacion}
            </p>
          </Card>
        )}

        <section aria-labelledby="servicios-cita" className="flex flex-col gap-3">
          <h2 id="servicios-cita" className="type-eyebrow">
            SERVICIOS
          </h2>

          {cita.personas.length === 0 ? (
            <p className="type-small text-secondary">Sin servicios registrados.</p>
          ) : (
            cita.personas.map((persona, indice) => (
              <Card key={`${persona.esTitular ? 'titular' : 'acompanante'}-${indice}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="type-card-title">
                    {persona.esTitular
                      ? 'Tú'
                      : persona.nombreAcompanante?.trim() || 'Acompañante'}
                  </p>
                  <span className="type-helper font-mono">
                    {persona.duracionTotalMinutos} min
                  </span>
                </div>
                <ul className="mt-3 flex flex-col gap-2">
                  {persona.servicios.map((servicio, indiceServicio) => (
                    <li
                      key={`${servicio.nombre}-${indiceServicio}`}
                      className="flex items-baseline justify-between gap-3"
                    >
                      <span className="type-small min-w-0">
                        {servicio.nombre}
                        <span className="type-helper"> · {servicio.duracionMinutos} min</span>
                      </span>
                      <Money monto={servicio.precio} tamano="base" />
                    </li>
                  ))}
                </ul>
              </Card>
            ))
          )}
        </section>

        <Card className="flex items-baseline justify-between gap-3">
          <span className="type-form text-secondary">A pagar en el local</span>
          <Money monto={cita.montoTotal} tamano="destacado" />
        </Card>

        <Link
          to={`/b/${encodeURIComponent(cita.barbero.codigo)}`}
          className="kf-press type-form inline-flex min-h-[var(--height-button)] w-full items-center justify-center rounded-[var(--radius-button)] bg-accent px-[var(--padding-button-x)] font-semibold text-ink"
        >
          Volver a reservar con este barbero
        </Link>
      </div>
    </main>
  )
}

function CitaNoEncontrada() {
  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-6">
        <EmptyState
          titulo="No encontramos esta cita"
          descripcion="Puede que ya no exista o no pertenezca a tu cuenta."
          accion={
            <Link
              to="/mi/citas"
              className="type-form inline-flex min-h-[var(--height-button)] items-center justify-center rounded-[var(--radius-button)] bg-accent px-[var(--padding-button-x)] font-semibold text-ink"
            >
              Ir a mis citas
            </Link>
          }
        />
      </div>
    </main>
  )
}

function DetalleCargando() {
  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 w-4/5" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </main>
  )
}
