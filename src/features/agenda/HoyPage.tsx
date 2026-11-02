import { Clock, TriangleAlert, Users, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardHoy } from '@/features/agenda/hooks'
import {
  acompanantesDeCita,
  calcularContadores,
  estadoVisualCita,
  minutosEntreHoras,
  nombreCliente,
  propinaDeCita,
  seleccionarProximaCita,
  serviciosDeCita,
  type PuntoCita,
} from '@/features/agenda/domain/agenda'
import { encabezadoHoy } from '@/features/agenda/domain/hoy'
import { SheetCancelarCita } from '@/features/agenda/components/SheetCancelarCita'
import {
  SheetClienteAtendido,
  type ModoAtendido,
} from '@/features/agenda/components/SheetClienteAtendido'
import { SheetNoAsistio } from '@/features/agenda/components/SheetNoAsistio'
import type { CitaBarbero, DashboardHoy } from '@/features/agenda/types'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/shared/lib/cn'
import { hora12 } from '@/shared/lib/fechas'
import { formatearDuracion, formatearPesos } from '@/shared/lib/format'
import { useAhora } from '@/shared/lib/useAhora'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Chip } from '@/shared/ui/Chip'
import { EmptyState } from '@/shared/ui/EmptyState'
import { EstadoError } from '@/shared/ui/EstadoError'
import { Money } from '@/shared/ui/Money'
import { ScreenHeader } from '@/shared/ui/ScreenHeader'
import { Skeleton } from '@/shared/ui/Skeleton'

/** Pantalla Hoy (`/app/hoy`), como DISENO.md 6.3. */
export function HoyPage() {
  const { nombre } = useAuth()
  const ahora = useAhora(30_000)
  const { data, isPending, isError, isFetching, refetch } = useDashboardHoy()

  const [atendido, setAtendido] = useState<{
    cita: CitaBarbero
    modo: ModoAtendido
  } | null>(null)
  const [cancelar, setCancelar] = useState<CitaBarbero | null>(null)
  const [noAsistio, setNoAsistio] = useState<CitaBarbero | null>(null)

  const cerrarAtendido = useCallback(() => setAtendido(null), [])
  const cerrarCancelar = useCallback(() => setCancelar(null), [])
  const cerrarNoAsistio = useCallback(() => setNoAsistio(null), [])

  const encabezado = encabezadoHoy(nombre, new Date(ahora))

  return (
    <main className="screen screen-with-nav">
      <ScreenHeader eyebrow={encabezado.eyebrow} titulo={encabezado.titulo} />

      {isPending && <CargandoHoy />}

      {isError && !data && (
        <div className="mt-7">
          <EstadoError
            mensaje="No pudimos cargar tu agenda. Revisa tu conexión e inténtalo de nuevo."
            onReintentar={() => void refetch()}
            reintentando={isFetching}
          />
        </div>
      )}

      {data && (
        <Contenido
          datos={data}
          onAtendido={(cita) => setAtendido({ cita, modo: 'atendido' })}
          onCorregirPropina={(cita) => setAtendido({ cita, modo: 'propina' })}
          onCancelar={(cita) => setCancelar(cita)}
          onNoAsistio={(cita) => setNoAsistio(cita)}
        />
      )}

      <SheetClienteAtendido
        cita={atendido?.cita ?? null}
        modo={atendido?.modo ?? 'atendido'}
        onCerrar={cerrarAtendido}
      />
      <SheetCancelarCita cita={cancelar} onCerrar={cerrarCancelar} />
      <SheetNoAsistio cita={noAsistio} onCerrar={cerrarNoAsistio} />
    </main>
  )
}

function Contenido({
  datos,
  onAtendido,
  onCorregirPropina,
  onCancelar,
  onNoAsistio,
}: {
  datos: DashboardHoy
  onAtendido: (cita: CitaBarbero) => void
  onCorregirPropina: (cita: CitaBarbero) => void
  onCancelar: (cita: CitaBarbero) => void
  onNoAsistio: (cita: CitaBarbero) => void
}) {
  const citas = datos.citas ?? []
  const huecos = datos.huecosLibres ?? []
  const bloques = datos.bloquesDeTrabajo ?? []
  const contadores = calcularContadores(datos.resumen)
  const proxima = seleccionarProximaCita(citas)

  return (
    <>
      <div className="mt-7 grid grid-cols-[repeat(3,minmax(0,1fr))] items-stretch gap-3">
        <Contador etiqueta="Por atender" valor={contadores.porAtender} />
        <Contador etiqueta="Atendidos" valor={contadores.atendidos} />
        <Link
          to="/app/solicitudes"
          aria-label={`${contadores.solicitudes} solicitudes pendientes. Ir a Solicitudes`}
          className="kf-press flex h-full min-w-0 rounded-[var(--radius-card)]"
        >
          <Contador etiqueta="Solicitudes" valor={contadores.solicitudes} ambar />
        </Link>
      </div>

      <section className="mt-9">
        <h2 className="type-card-title">Agenda de hoy</h2>

        {citas.length === 0 ? (
          <EmptyState
            className="mt-4"
            titulo="No tienes citas para hoy"
            descripcion="Tus citas aceptadas aparecerán aquí en orden de hora."
          />
        ) : (
          <ol className="mt-4 flex flex-col">
            {citas.map((cita, indice) => (
              <FilaAgenda
                key={cita.id}
                cita={cita}
                punto={estadoVisualCita(cita, proxima?.id ?? null)}
                mostrarLineaArriba={indice > 0}
                mostrarLineaAbajo={indice < citas.length - 1}
                onAtendido={onAtendido}
                onCorregirPropina={onCorregirPropina}
                onCancelar={onCancelar}
                onNoAsistio={onNoAsistio}
              />
            ))}
          </ol>
        )}
      </section>

      <section className="mt-9 pb-4">
        <h2 className="type-card-title">Horarios libres</h2>

        {huecos.length === 0 && bloques.length === 0 && (
          <p className="type-aux mt-3">Hoy no tienes horario de trabajo.</p>
        )}

        {huecos.length === 0 && bloques.length > 0 && (
          <p className="type-aux mt-3">Hoy no tienes horarios libres.</p>
        )}

        {huecos.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {huecos.map((hueco) => (
              <li key={`${hueco.horaInicio}-${hueco.horaFin}`}>
                <Chip variante="verde" className="font-mono tabular-nums">
                  {hora12(hueco.horaInicio)} – {hora12(hueco.horaFin)}
                </Chip>
              </li>
            ))}
          </ul>
        )}

        {bloques.length > 0 && (
          <p className="type-helper mt-3 font-mono">
            Bloques:{' '}
            {bloques
              .map((bloque) => `${hora12(bloque.horaInicio)} – ${hora12(bloque.horaFin)}`)
              .join(' · ')}
          </p>
        )}
      </section>
    </>
  )
}

function Contador({
  etiqueta,
  valor,
  ambar = false,
}: {
  etiqueta: string
  valor: number
  ambar?: boolean
}) {
  return (
    <div className="flex h-full w-full min-w-0 flex-col gap-1 rounded-[var(--radius-card)] border border-line bg-card px-[var(--space-gap-sm)] py-[var(--space-gap)]">
      <span
        className={cn(
          'font-mono text-[var(--font-size-metric)] leading-none tabular-nums',
          ambar ? 'text-amber' : 'text-text',
        )}
      >
        {valor}
      </span>
      <span className="type-helper whitespace-nowrap text-secondary">{etiqueta}</span>
    </div>
  )
}

const ESTILOS_PUNTO: Record<PuntoCita, string> = {
  atendida: 'size-[10px] bg-dim',
  proxima: 'size-[18px] border-[4px] border-accent-20 bg-bg',
  futura: 'size-[10px] border border-dim bg-bg',
  noAsistio: 'size-[10px] bg-red-60',
}

function FilaAgenda({
  cita,
  punto,
  mostrarLineaArriba,
  mostrarLineaAbajo,
  onAtendido,
  onCorregirPropina,
  onCancelar,
  onNoAsistio,
}: {
  cita: CitaBarbero
  punto: PuntoCita
  mostrarLineaArriba: boolean
  mostrarLineaAbajo: boolean
  onAtendido: (cita: CitaBarbero) => void
  onCorregirPropina: (cita: CitaBarbero) => void
  onCancelar: (cita: CitaBarbero) => void
  onNoAsistio: (cita: CitaBarbero) => void
}) {
  const nombre = nombreCliente(cita)
  const servicios = serviciosDeCita(cita)
  const acompanantes = acompanantesDeCita(cita)
  const propina = propinaDeCita(cita)
  const duracion = minutosEntreHoras(cita.horaInicio, cita.horaFin)

  const detalleAcompanantes = acompanantes
    .map((acompanante) =>
      acompanante.nombre
        ? `${acompanante.nombre}: ${acompanante.servicios.join(', ') || 'sin servicio'}`
        : acompanante.servicios.join(', '),
    )
    .filter((texto) => texto.length > 0)
    .join(' · ')

  const puedeNoAsistir = cita.puedeMarcarNoAsistio === true
  const idAyudaNoAsistio = `no-asistio-${cita.id}`

  return (
    <li className="grid grid-cols-[62px_18px_minmax(0,1fr)] items-stretch gap-x-3 pb-3">
      <div className="flex flex-col items-end gap-0.5 pt-4">
        <span className="whitespace-nowrap font-mono text-[var(--font-size-tiny)] tabular-nums text-text">
          {hora12(cita.horaInicio)}
        </span>
        <span className="font-mono text-[var(--font-size-tiny)] tabular-nums text-dim">
          {formatearDuracion(duracion, { estilo: 'servicio' })}
        </span>
      </div>

      <div className="relative flex justify-center">
        {mostrarLineaArriba && (
          <span aria-hidden="true" className="absolute top-0 h-[22px] w-px bg-line" />
        )}
        {mostrarLineaAbajo && (
          <span aria-hidden="true" className="absolute bottom-0 top-[22px] w-px bg-line" />
        )}
        <span
          aria-hidden="true"
          className={cn('relative z-10 mt-[16px] rounded-[var(--radius-pill)]', ESTILOS_PUNTO[punto])}
        />
      </div>

      <Card
        variante="agenda"
        className={cn(
          'flex flex-col gap-2',
          punto === 'atendida' && 'opacity-[var(--opacity-attended)]',
          punto === 'noAsistio' && 'opacity-[var(--opacity-attended)]',
          punto === 'proxima' && 'border-accent-40 ring-4 ring-accent-20',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="type-card-title truncate">{nombre}</p>
            <p className="type-aux mt-1">{servicios.join(' · ') || 'Servicio'}</p>
          </div>
          <Money monto={cita.montoTotal} tamano="destacado" className="shrink-0 text-text" />
        </div>

        {detalleAcompanantes && (
          <p className="type-aux flex items-start gap-1.5 text-secondary">
            <Users
              aria-hidden="true"
              size={14}
              strokeWidth={1.6}
              className="mt-1 shrink-0"
            />
            <span>{detalleAcompanantes}</span>
          </p>
        )}

        {cita.avisoDescanso && (
          <p className="flex items-start gap-1.5 rounded-[var(--radius-warning)] border border-amber-30 bg-amber-10 p-2 text-amber">
            <TriangleAlert
              aria-hidden="true"
              size={14}
              strokeWidth={1.6}
              className="mt-0.5 shrink-0"
            />
            <span className="type-small">{cita.avisoDescanso}</span>
          </p>
        )}

        {punto === 'atendida' && (
          <button
            type="button"
            onClick={() => onCorregirPropina(cita)}
            aria-label={`Atendido. Corregir la propina de ${nombre}`}
            className="kf-press flex min-h-[var(--height-button-compact)] w-full items-center gap-1 text-left text-green"
          >
            <span className="type-small font-medium">Atendido</span>
            {propina > 0 && (
              <span className="type-small">· propina {formatearPesos(propina)}</span>
            )}
            <Clock aria-hidden="true" size={14} strokeWidth={1.6} className="ml-auto" />
          </button>
        )}

        {punto === 'noAsistio' && (
          <p className="type-small font-medium text-red">No asistió</p>
        )}

        {cita.estado === 'aceptada' && (
          /*
           * La tarjeta solo tiene ~186 px útiles a 360 px de ancho (columna de
           * hora + punto + gaps + padding). Con `gap-2` y el padding por
           * defecto, "Atendido" + "No asistió" + la X pasaban de 230 px y la X
           * terminaba fuera de la tarjeta, cortada por la mitad. Ahora:
           * - `flex-wrap`: si no cabe, la X baja a una segunda línea (nunca se
           *   recorta ni se sale de la pantalla),
           * - `gap-1.5` y `px-2` en los botones de texto para ganar ~24 px,
           * - `ml-auto` mantiene la X al extremo derecho y `size-10` conserva
           *   el área táctil de 40 px.
           */
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Button
              tamano="compacto"
              className="kf-press-compact min-w-0 px-2"
              onClick={() => onAtendido(cita)}
            >
              Atendido
            </Button>

            <Button
              variante="ghost"
              tamano="compacto"
              className="min-w-0 px-2"
              onClick={() => onNoAsistio(cita)}
              disabled={!puedeNoAsistir}
              aria-disabled={!puedeNoAsistir || undefined}
              aria-describedby={!puedeNoAsistir ? idAyudaNoAsistio : undefined}
              title={puedeNoAsistir ? undefined : 'Disponible desde la hora de inicio'}
            >
              No asistió
            </Button>

            {!puedeNoAsistir && (
              <span id={idAyudaNoAsistio} className="sr-only">
                Disponible desde la hora de inicio
              </span>
            )}

            <Button
              variante="ghost"
              tamano="compacto"
              onClick={() => onCancelar(cita)}
              aria-label={`Cancelar la cita de ${nombre}`}
              className="ml-auto size-10 shrink-0 px-0"
            >
              <X aria-hidden="true" size={18} strokeWidth={1.6} />
            </Button>
          </div>
        )}
      </Card>
    </li>
  )
}

function CargandoHoy() {
  return (
    <div className="mt-7 flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-[74px] w-full" />
        <Skeleton className="h-[74px] w-full" />
        <Skeleton className="h-[74px] w-full" />
      </div>
      <Skeleton className="mt-4 h-[104px] w-full" />
      <Skeleton className="h-[104px] w-full" />
      <Skeleton className="h-[104px] w-full" />
    </div>
  )
}
