import { Check, ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { mensajeDeError } from '@/features/agenda/domain/errores'
import {
  ATAJOS_PROPINA,
  PROPINA_MAX_DIGITOS,
  formatearMilesEntrada,
  validarPropina,
} from '@/features/agenda/domain/propina'
import {
  DURACION_SIN_CITA_MAX,
  DURACION_SIN_CITA_MIN,
  MAX_SERVICIOS_SIN_CITA,
  MONTO_COBRADO_MAX_DIGITOS,
  alternarServicio,
  construirCuerpoSinCita,
  duracionCatalogo,
  puedeAgregarServicio,
  totalCatalogo,
  validarSinCita,
} from '@/features/agenda/domain/sinCita'
import { useRegistrarServicioSinCita, useServiciosActivos } from '@/features/agenda/hooks'
import type { ModoServicioSinCita, ServicioSinCita } from '@/features/agenda/types'
import { cn } from '@/shared/lib/cn'
import { formatearDuracion, formatearPesos } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { EstadoError } from '@/shared/ui/EstadoError'
import { Input } from '@/shared/ui/Input'
import { Money } from '@/shared/ui/Money'
import { MoneyInput } from '@/shared/ui/MoneyInput'
import { Segmented } from '@/shared/ui/Segmented'
import { Sheet } from '@/shared/ui/Sheet'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useToast } from '@/shared/ui/toast-context'

export interface SheetClienteSinCitaProps {
  abierto: boolean
  onCerrar: () => void
}

const OPCIONES_MODO = [
  { valor: 'atendido', etiqueta: 'Ya lo atendí' },
  { valor: 'en_curso', etiqueta: 'Empezar ahora' },
] as const

const OPCIONES_PROPINA = [
  { valor: 'no', etiqueta: 'No' },
  { valor: 'si', etiqueta: 'Sí' },
] as const

type ValorPropina = (typeof OPCIONES_PROPINA)[number]['valor']

/**
 * Sheet «Cliente sin cita».
 *
 * Registra a alguien que llegó de la calle. No envía WhatsApp, push ni
 * recordatorios en ningún caso (`POST /barbero/servicios-sin-cita`).
 *
 * - `atendido`: el servicio ya terminó; suma al balance de hoy y no ocupa
 *   agenda. Permite propina.
 * - `en_curso`: el cliente se acaba de sentar; queda `aceptada`, bloquea la
 *   agenda desde ahora y termina con «Atendido» desde el inicio. Sin propina.
 *
 * El modo se elige antes de confirmar, así la propina nunca se envía con
 * `en_curso` (el backend responde 400).
 */
export function SheetClienteSinCita({ abierto, onCerrar }: SheetClienteSinCitaProps) {
  return (
    <Sheet
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Cliente sin cita"
      descripcion="Registra un servicio que no venía por reserva. No se envían recordatorios."
    >
      {abierto && <ContenidoSinCita onCerrar={onCerrar} />}
    </Sheet>
  )
}

function ContenidoSinCita({ onCerrar }: { onCerrar: () => void }) {
  const { mostrarToast } = useToast()
  const consulta = useServiciosActivos()
  const mutacion = useRegistrarServicioSinCita()
  const idDatos = useId()

  const [modo, setModo] = useState<ModoServicioSinCita>('atendido')
  const [seleccionados, setSeleccionados] = useState<number[]>([])
  const [montoEditado, setMontoEditado] = useState<string | null>(null)
  const [conPropina, setConPropina] = useState<ValorPropina>('no')
  const [textoPropina, setTextoPropina] = useState('')
  const [mostrarDatos, setMostrarDatos] = useState(false)
  const [nombre, setNombre] = useState('')
  const [celular, setCelular] = useState('')
  const [intentado, setIntentado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avisoServicios, setAvisoServicios] = useState<string | null>(null)

  const catalogo = consulta.data ?? []
  const elegidos = catalogo.filter((servicio) => seleccionados.includes(servicio.id))
  const total = totalCatalogo(elegidos)
  const duracion = duracionCatalogo(elegidos)

  // Mientras el barbero no escriba, el campo refleja el total del catálogo.
  const textoMonto =
    montoEditado ?? (total > 0 ? formatearMilesEntrada(String(total), MONTO_COBRADO_MAX_DIGITOS) : '')

  const resultado = validarSinCita({
    modo,
    catalogo,
    seleccionados,
    textoMonto,
    textoPropina: conPropina === 'si' ? textoPropina : '',
    nombre,
    celular,
  })

  const pendiente = mutacion.isPending
  const propinaIncompleta = conPropina === 'si' && textoPropina.trim() === ''
  const propinaValida =
    conPropina === 'si' ? validarPropina(textoPropina, { permiteCero: false }) : null
  const errorPropina = propinaIncompleta
    ? 'Escribe el monto de la propina.'
    : (propinaValida?.error ?? undefined)

  function alternar(id: number): void {
    if (!seleccionados.includes(id) && !puedeAgregarServicio(seleccionados)) {
      setAvisoServicios(`Puedes elegir hasta ${MAX_SERVICIOS_SIN_CITA} servicios.`)
      return
    }

    setSeleccionados(alternarServicio(seleccionados, id))
    setAvisoServicios(null)
    setError(null)
  }

  function cambiarModo(valor: ModoServicioSinCita): void {
    setModo(valor)
    setError(null)
  }

  function usarAtajoPropina(monto: number): void {
    setConPropina('si')
    setTextoPropina(formatearMilesEntrada(String(monto), PROPINA_MAX_DIGITOS))
  }

  function confirmar(): void {
    if (pendiente) return

    setIntentado(true)
    setError(null)

    if (!resultado.valido || (modo === 'atendido' && propinaIncompleta)) {
      // Un dato opcional con error no puede quedar escondido.
      if (resultado.errores.nombre || resultado.errores.celular) setMostrarDatos(true)
      return
    }

    const cuerpo = construirCuerpoSinCita(resultado)
    if (!cuerpo) return

    mutacion.mutate(cuerpo, {
      onSuccess: () => {
        mostrarToast({ mensaje: 'Servicio registrado.', duracionMs: 8000 })
        onCerrar()
      },
      onError: (fallo) => setError(mensajeDeError('servicioSinCita', fallo).mensaje),
    })
  }

  if (consulta.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-[72px] w-full" />
        <Skeleton className="h-[72px] w-full" />
        <Skeleton className="h-[72px] w-full" />
        <span className="sr-only">Cargando servicios</span>
      </div>
    )
  }

  if (consulta.isError && !consulta.data) {
    return (
      <EstadoError
        mensaje="No pudimos cargar tus servicios. Revisa tu conexión e inténtalo de nuevo."
        onReintentar={() => void consulta.refetch()}
        reintentando={consulta.isFetching}
      />
    )
  }

  if (catalogo.length === 0) {
    return (
      <EmptyState
        titulo="No tienes servicios activos"
        descripcion="Crea o reactiva un servicio en Ajustes para poder registrarlo sin cita."
      />
    )
  }

  const mostrarErrorServicios = intentado || avisoServicios !== null
  const errorServicios =
    avisoServicios ??
    (mostrarErrorServicios ? resultado.errores.servicios : undefined)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="type-label">¿Cómo lo registras?</p>
        <Segmented
          etiqueta="¿Cómo lo registras?"
          opciones={OPCIONES_MODO}
          valor={modo}
          onCambio={cambiarModo}
        />
        <p className="type-helper">
          {modo === 'atendido'
            ? 'Suma al balance de hoy y no ocupa la agenda.'
            : 'Bloquea la agenda desde ahora. Al terminar, márcalo Atendido desde el inicio.'}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="type-label">Servicios</p>
          <p className="type-helper font-mono tabular-nums">
            {seleccionados.length}/{MAX_SERVICIOS_SIN_CITA}
          </p>
        </div>

        <div role="group" aria-label="Servicios" className="flex flex-col gap-2">
          {catalogo.map((servicio) => (
            <OpcionServicio
              key={servicio.id}
              servicio={servicio}
              seleccionado={seleccionados.includes(servicio.id)}
              onAlternar={() => alternar(servicio.id)}
            />
          ))}
        </div>

        {errorServicios && (
          <p role="alert" className="type-helper text-red">
            {errorServicios}
          </p>
        )}
      </div>

      <div className="rounded-[var(--radius-card)] border border-line bg-card p-[var(--space-card)]">
        <p className="type-eyebrow">TOTAL DEL CATÁLOGO</p>
        <Money monto={total} tamano="total" className="mt-2 block text-text" />
        <p className="type-aux mt-2">
          {elegidos.length === 0
            ? 'Elige los servicios para ver el total.'
            : `${elegidos.length} ${elegidos.length === 1 ? 'servicio' : 'servicios'} · ${formatearDuracion(duracion, { estilo: 'servicio' })}`}
        </p>
        {elegidos.length > 0 &&
          (duracion < DURACION_SIN_CITA_MIN || duracion > DURACION_SIN_CITA_MAX) && (
            <p role="status" className="type-helper mt-2 text-amber">
              La duración total debe estar entre {DURACION_SIN_CITA_MIN} y{' '}
              {DURACION_SIN_CITA_MAX} minutos.
            </p>
          )}
      </div>

      <MoneyInput
        etiqueta="Monto cobrado"
        valor={textoMonto}
        onCambio={setMontoEditado}
        maxDigitos={MONTO_COBRADO_MAX_DIGITOS}
        placeholder={total > 0 ? formatearPesos(total) : '0'}
        ayuda="Déjalo igual al total o vacío para usar la suma del catálogo."
        error={
          textoMonto.trim() || intentado ? resultado.errores.monto : undefined
        }
      />

      {modo === 'atendido' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <p className="type-label">¿Dejó propina?</p>
            <Segmented
              etiqueta="¿Dejó propina?"
              opciones={OPCIONES_PROPINA}
              valor={conPropina}
              onCambio={setConPropina}
            />
          </div>

          {conPropina === 'si' && (
            <>
              <MoneyInput
                etiqueta="Propina"
                valor={textoPropina}
                onCambio={setTextoPropina}
                maxDigitos={PROPINA_MAX_DIGITOS}
                placeholder="5.000"
                ayuda="Entero entre $1 y $1.000.000"
                error={
                  textoPropina.trim() || intentado ? errorPropina : undefined
                }
              />
              <div className="flex flex-wrap gap-2">
                {ATAJOS_PROPINA.map((monto) => (
                  <Button
                    key={monto}
                    variante="ghost"
                    tamano="compacto"
                    onClick={() => usarAtajoPropina(monto)}
                  >
                    {formatearPesos(monto)}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="rounded-[var(--radius-card)] border border-line">
        <button
          type="button"
          onClick={() => setMostrarDatos((valor) => !valor)}
          aria-expanded={mostrarDatos}
          aria-controls={idDatos}
          className="kf-press flex min-h-[var(--height-button)] w-full items-center justify-between gap-3 px-[var(--space-gap-lg)] py-3 text-left"
        >
          <span className="min-w-0">
            <span className="type-label block">Nombre y celular</span>
            <span className="type-helper block">Opcional. Sirven para identificar al cliente.</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            size={16}
            strokeWidth={1.6}
            className={cn(
              'shrink-0 text-dim transition-transform',
              mostrarDatos && 'rotate-180',
            )}
          />
        </button>

        {mostrarDatos && (
          <div id={idDatos} className="flex flex-col gap-4 px-[var(--space-gap-lg)] pb-[var(--space-gap-lg)]">
            <Input
              etiqueta="Nombre"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              autoComplete="off"
              placeholder="Pedro"
              error={intentado ? resultado.errores.nombre : undefined}
            />
            <Input
              etiqueta="Celular"
              type="tel"
              inputMode="tel"
              value={celular}
              onChange={(evento) => setCelular(evento.target.value)}
              autoComplete="off"
              placeholder="300 111 2233"
              ayuda="Se acepta +57 y espacios."
              error={intentado ? resultado.errores.celular : undefined}
            />
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="type-helper text-red">
          {error}
        </p>
      )}

      {error && modo === 'en_curso' && (
        <p className="type-helper text-amber">
          Si el cliente ya está sentado, regístralo con «Ya lo atendí».
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          onClick={confirmar}
          disabled={pendiente}
          aria-disabled={pendiente || undefined}
          cargando={pendiente}
          className="w-full"
        >
          {modo === 'atendido' ? 'Registrar cobro' : 'Empezar ahora'}
        </Button>
        <Button variante="ghost" onClick={onCerrar} className="w-full">
          Volver
        </Button>
      </div>

      <p className="type-helper">
        {modo === 'atendido'
          ? 'El servicio queda atendido y el dinero suma al balance de hoy.'
          : 'La propina se registra al marcar «Atendido».'}
      </p>
    </div>
  )
}

function OpcionServicio({
  servicio,
  seleccionado,
  onAlternar,
}: {
  servicio: ServicioSinCita
  seleccionado: boolean
  onAlternar: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={seleccionado}
      onClick={onAlternar}
      className={cn(
        'kf-press w-full rounded-[var(--radius-card)] border p-[var(--space-card-agenda)] text-left transition-colors',
        seleccionado ? 'border-accent bg-card' : 'border-line bg-card-50 hover:border-accent-40',
      )}
    >
      <span className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 flex size-[var(--size-icon-confirmation)] shrink-0 items-center justify-center rounded-[var(--radius-pill)] border',
            seleccionado
              ? 'border-accent bg-accent text-ink'
              : 'border-white-20 text-transparent',
          )}
        >
          <Check size={14} strokeWidth={1.6} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span className="type-form font-medium break-words text-text">
              {servicio.nombre}
            </span>
            <Money monto={servicio.precio} className="shrink-0" />
          </span>
          <span className="type-helper mt-1 block">
            {formatearDuracion(servicio.duracionMinutos, { estilo: 'servicio' })}
          </span>
        </span>
      </span>
    </button>
  )
}
