import { ArrowRight, Clock, TriangleAlert, Users } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  acompanantesDeCita,
  nombreCliente,
  serviciosDeCita,
} from '@/features/agenda/domain/agenda'
import { mensajeDeError } from '@/features/agenda/domain/errores'
import { useAceptarSolicitud } from '@/features/agenda/hooks'
import type { Solicitud } from '@/features/agenda/types'
import { calcularCuentaRegresiva } from '@/features/solicitudes/domain/cuentaRegresiva'
import { etiquetaFechaSolicitud } from '@/features/solicitudes/domain/fecha'
import { SheetRechazarSolicitud } from '@/features/solicitudes/components/SheetRechazarSolicitud'
import { useSolicitudes } from '@/features/solicitudes/hooks'
import { cn } from '@/shared/lib/cn'
import { hora12 } from '@/shared/lib/fechas'
import { formatearCelular } from '@/shared/lib/format'
import { useAhora } from '@/shared/lib/useAhora'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { EstadoError } from '@/shared/ui/EstadoError'
import { Money } from '@/shared/ui/Money'
import { ScreenHeader } from '@/shared/ui/ScreenHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useToast } from '@/shared/ui/toast-context'

/** Pantalla Solicitudes (`/app/solicitudes`), como DISENO.md 6.6. */
export function SolicitudesPage() {
  const { mostrarToast } = useToast()
  const ahora = useAhora(30_000)
  const { data, dataUpdatedAt, isPending, isError, isFetching, refetch } =
    useSolicitudes()
  const aceptar = useAceptarSolicitud()

  const [rechazo, setRechazo] = useState<Solicitud | null>(null)
  const cerrarRechazo = useCallback(() => setRechazo(null), [])

  const solicitudes = data ?? []

  const vencidas = solicitudes.filter(
    (solicitud) =>
      calcularCuentaRegresiva(solicitud.minutosRestantes, dataUpdatedAt, ahora)
        ?.vencida === true,
  )
  const claveVencidas = vencidas.map((solicitud) => solicitud.id).join(',')
  const ultimoRefresco = useRef(0)

  useEffect(() => {
    if (!claveVencidas) return
    const instante = Date.now()
    // Evita un bucle si el backend todavía no refleja la expiración.
    if (instante - ultimoRefresco.current < 10_000) return
    ultimoRefresco.current = instante
    void refetch()
  }, [claveVencidas, refetch])

  function aceptarSolicitud(solicitud: Solicitud): void {
    if (aceptar.isPending) return

    aceptar.mutate(solicitud.id, {
      onSuccess: (respuesta) => {
        mostrarToast({
          mensaje: 'Solicitud aceptada.',
          duracionMs: 8000,
          accion: respuesta.whatsappUrl
            ? { etiqueta: 'Avisar', href: respuesta.whatsappUrl }
            : undefined,
        })
      },
      onError: (fallo) => {
        mostrarToast({
          mensaje: mensajeDeError('aceptar', fallo).mensaje,
          duracionMs: 8000,
        })
      },
    })
  }

  return (
    <main className="screen screen-with-nav">
      <ScreenHeader
        eyebrow="ORDENADAS POR URGENCIA"
        titulo="Solicitudes"
        descripcion="Si no respondes en 2 horas, la solicitud expira y el horario queda libre."
      />

      {isPending && <CargandoSolicitudes />}

      {isError && !data && (
        <div className="mt-7">
          <EstadoError
            mensaje="No pudimos cargar las solicitudes. Revisa tu conexión e inténtalo de nuevo."
            onReintentar={() => void refetch()}
            reintentando={isFetching}
          />
        </div>
      )}

      {data && solicitudes.length === 0 && (
        <EmptyState
          className="mt-7"
          titulo="No tienes solicitudes pendientes"
          descripcion="Cuando un cliente pida una cita, aparecerá aquí ordenada por urgencia."
        />
      )}

      {solicitudes.length > 0 && (
        <ul className="mt-7 flex flex-col gap-3">
          {solicitudes.map((solicitud) => (
            <li key={solicitud.id}>
              <TarjetaSolicitud
                solicitud={solicitud}
                obtenidoEnMs={dataUpdatedAt}
                ahoraMs={ahora}
                aceptando={
                  aceptar.isPending && aceptar.variables === solicitud.id
                }
                bloquearAceptar={aceptar.isPending}
                onAceptar={() => aceptarSolicitud(solicitud)}
                onRechazar={() => setRechazo(solicitud)}
              />
            </li>
          ))}
        </ul>
      )}

      <SheetRechazarSolicitud solicitud={rechazo} onCerrar={cerrarRechazo} />
    </main>
  )
}

function TarjetaSolicitud({
  solicitud,
  obtenidoEnMs,
  ahoraMs,
  aceptando,
  bloquearAceptar,
  onAceptar,
  onRechazar,
}: {
  solicitud: Solicitud
  obtenidoEnMs: number
  ahoraMs: number
  aceptando: boolean
  bloquearAceptar: boolean
  onAceptar: () => void
  onRechazar: () => void
}) {
  const cuenta = calcularCuentaRegresiva(
    solicitud.minutosRestantes,
    obtenidoEnMs,
    ahoraMs,
  )
  const vencida = cuenta?.vencida === true
  const nombre = nombreCliente(solicitud)
  const servicios = serviciosDeCita(solicitud)
  const acompanantes = acompanantesDeCita(solicitud)

  return (
    <Card
      className={cn(
        'flex flex-col gap-3',
        vencida && 'opacity-[var(--opacity-inactive)]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {cuenta && (
          <span
            className={cn(
              'type-small inline-flex items-center gap-1.5',
              vencida ? 'text-red' : 'text-amber',
            )}
          >
            <Clock aria-hidden="true" size={14} strokeWidth={1.6} />
            {cuenta.texto}
          </span>
        )}
        <Money
          monto={solicitud.montoTotal}
          tamano="destacado"
          className="ml-auto shrink-0 text-text"
        />
      </div>

      <div>
        <p className="type-card-title">{nombre}</p>
        <p className="type-aux font-mono tabular-nums">
          {formatearCelular(solicitud.cliente?.celular ?? '')}
        </p>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="type-small text-secondary">
          {etiquetaFechaSolicitud(solicitud.fecha)}
        </span>
        <span className="font-mono text-[var(--font-size-highlight)] leading-none tabular-nums text-text">
          {hora12(solicitud.horaInicio)}
        </span>
        <ArrowRight
          aria-hidden="true"
          size={14}
          strokeWidth={1.6}
          className="text-dim"
        />
        <span className="type-small font-mono tabular-nums text-secondary">
          {hora12(solicitud.horaFin)}
        </span>
      </div>

      <p className="type-aux">{servicios.join(' · ') || 'Servicio'}</p>

      {solicitud.numPersonas > 1 && (
        <div className="flex flex-col gap-1">
          <p className="type-aux inline-flex items-center gap-1.5 text-secondary">
            <Users aria-hidden="true" size={14} strokeWidth={1.6} />
            {solicitud.numPersonas} personas
          </p>
          {acompanantes.length > 0 && (
            <ul className="flex flex-col gap-0.5 pl-5">
              {acompanantes.map((acompanante, indice) => (
                <li
                  key={`${acompanante.nombre ?? 'acompanante'}-${indice}`}
                  className="type-helper"
                >
                  {acompanante.nombre ? `${acompanante.nombre}: ` : ''}
                  {acompanante.servicios.join(', ') || 'sin servicio'}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {solicitud.avisoDescanso && (
        <p className="flex items-start gap-1.5 rounded-[var(--radius-warning)] border border-amber-30 bg-amber-10 p-[var(--space-warning)] text-amber">
          <TriangleAlert
            aria-hidden="true"
            size={14}
            strokeWidth={1.6}
            className="mt-0.5 shrink-0"
          />
          <span className="type-small">{solicitud.avisoDescanso}</span>
        </p>
      )}

      <div className="flex gap-2">
        <Button
          variante="ghost"
          onClick={onRechazar}
          disabled={vencida || aceptando}
          aria-disabled={vencida || aceptando || undefined}
          className="flex-1"
        >
          Rechazar
        </Button>
        <Button
          onClick={onAceptar}
          disabled={vencida || bloquearAceptar}
          aria-disabled={vencida || bloquearAceptar || undefined}
          cargando={aceptando}
          className="flex-1"
        >
          Aceptar
        </Button>
      </div>
    </Card>
  )
}

function CargandoSolicitudes() {
  return (
    <div className="mt-7 flex flex-col gap-3">
      <Skeleton className="h-[196px] w-full" />
      <Skeleton className="h-[196px] w-full" />
    </div>
  )
}
