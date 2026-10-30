import { ArrowRight, Plus } from 'lucide-react'
import { useMemo, useReducer, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { LogoKlippFlow } from '@/shared/ui/LogoKlippFlow'
import { Money } from '@/shared/ui/Money'
import { Segmented } from '@/shared/ui/Segmented'
import { Skeleton } from '@/shared/ui/Skeleton'
import { guardarCitaCliente, obtenerCitaActivaDeCodigo } from './almacenamientoCitas'
import { DiaSelector } from './components/DiaSelector'
import { SelectorServiciosAcompanante } from './components/SelectorServiciosAcompanante'
import { SlotButton } from './components/SlotButton'
import { TarjetaServicio } from './components/TarjetaServicio'
import {
  calcularTotales,
  esDuracionValida,
  esError404,
  esFormularioValido,
  generarDiasDisponibles,
  horaSigueDisponible,
  mapearErrorCreacion,
  MAXIMO_PERSONAS,
  puedeAgregarAcompanante,
  reducerFormularioReserva,
  seleccionParaTotales,
  validarDatos,
} from './domain'
import type {
  AccionFormularioReserva,
  CampoDatos,
} from './domain/formulario'
import { useBarberoPublico, useCrearCita, useDisponibilidad } from './hooks'
import type { BarberoPublico } from './types'
import { construirCuerpoCrearCita, crearEstadoInicial } from './domain/formulario'
import { useDebouncedValue } from './useDebouncedValue'

function ReservaPage() {
  const { codigo: parametro = '' } = useParams()
  const codigo = parametro.trim().toUpperCase()

  return <ContenidoReserva key={codigo} codigo={codigo} />
}

function ContenidoReserva({ codigo }: { codigo: string }) {
  const consulta = useBarberoPublico(codigo)

  if (consulta.isPending) return <ReservaCargando />

  if (consulta.isError) {
    if (esError404(consulta.error)) return <BarberiaNoEncontrada />
    return (
      <ErrorCarga
        titulo="No pudimos cargar la reserva"
        onReintentar={() => void consulta.refetch()}
      />
    )
  }

  return <FormularioReserva codigo={codigo} barbero={consulta.data} />
}

function ReservaCargando() {
  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-6">
        <Skeleton className="size-[44px]" pildora />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
        <div className="mt-8 flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </main>
  )
}

function BarberiaNoEncontrada() {
  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[520px] flex-col">
        <LogoKlippFlow tamano={44} />
        <EmptyState
          className="mt-8"
          titulo="No encontramos esta barbería"
          descripcion="Revisa el código e inténtalo de nuevo."
        />
      </div>
    </main>
  )
}

function ErrorCarga({
  titulo,
  onReintentar,
}: {
  titulo: string
  onReintentar: () => void
}) {
  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[520px] flex-col">
        <LogoKlippFlow tamano={44} />
        <EmptyState
          className="mt-8"
          titulo={titulo}
          descripcion="Algo salió mal. Inténtalo de nuevo."
          accion={
            <Button onClick={onReintentar} tamano="compacto">
              Reintentar
            </Button>
          }
        />
      </div>
    </main>
  )
}

function FormularioReserva({
  codigo,
  barbero,
}: {
  codigo: string
  barbero: BarberoPublico
}) {
  const navegar = useNavigate()
  const dias = useMemo(() => generarDiasDisponibles(), [])
  const fechaInicial = dias[0]?.fecha ?? ''
  const [form, dispatch] = useReducer(
    reducerFormularioReserva,
    fechaInicial,
    crearEstadoInicial,
  )
  const [tocados, setTocados] = useState({
    nombre: false,
    celular: false,
    correo: false,
  })
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const mutacion = useCrearCita(codigo)
  const citaActiva = useMemo(() => obtenerCitaActivaDeCodigo(codigo), [codigo])

  const totales = calcularTotales(seleccionParaTotales(form), barbero.servicios)
  const errores = validarDatos(form.datos)
  const hayServiciosTitular = form.serviciosTitular.length > 0
  const duracionValida = esDuracionValida(totales.duracionMinutos)

  const solicitud = useMemo(
    () => ({
      fecha: form.fecha,
      duracionMinutos: hayServiciosTitular ? totales.duracionMinutos : 0,
    }),
    [form.fecha, hayServiciosTitular, totales.duracionMinutos],
  )
  const solicitudDebounced = useDebouncedValue(solicitud, 400)
  const disponibilidad = useDisponibilidad(
    codigo,
    solicitudDebounced.fecha,
    solicitudDebounced.duracionMinutos,
  )
  const slots = disponibilidad.data?.slots ?? []
  const horaEfectiva = horaSigueDisponible(slots, form.horaInicio)
    ? form.horaInicio
    : null
  const formularioValido = esFormularioValido(
    { ...form, horaInicio: horaEfectiva },
    barbero.servicios,
  )

  const titulo = barbero.nombreBarberia
    ? `${barbero.nombres} · ${barbero.nombreBarberia}`
    : barbero.nombres

  function despachar(accion: AccionFormularioReserva) {
    setErrorEnvio(null)
    dispatch(accion)
  }

  function cambiarDato(campo: CampoDatos, valor: string) {
    despachar({ tipo: 'cambiar-dato', campo, valor })
  }

  function marcarTocado(campo: keyof typeof tocados) {
    setTocados((actual) => ({ ...actual, [campo]: true }))
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!formularioValido || !horaEfectiva || mutacion.isPending) return

    const cuerpo = construirCuerpoCrearCita(
      { ...form, horaInicio: horaEfectiva },
      barbero.servicios,
    )
    if (!cuerpo) return

    setErrorEnvio(null)
    mutacion.mutate(cuerpo, {
      onSuccess: (cita) => {
        guardarCitaCliente({
          token: cita.token,
          codigo,
          creadoEn: new Date().toISOString(),
        })
        navegar(`/cita/${cita.token}`)
      },
      onError: (error) => {
        const mapeado = mapearErrorCreacion(error)
        if (mapeado.descartarHora) {
          dispatch({ tipo: 'seleccionar-hora', horaInicio: null })
        }
        if (mapeado.recargarHorarios) {
          void disponibilidad.refetch()
        }
        setErrorEnvio(mapeado.mensaje)
      },
    })
  }

  return (
    <main className="flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <form onSubmit={enviar} className="flex flex-1 flex-col" noValidate>
        <div className="screen flex-1">
          <div className="mx-auto flex w-full max-w-[520px] flex-col gap-10">
            <header className="flex flex-col gap-4">
              <LogoKlippFlow tamano={44} />
              <div>
                <h1 className="type-public-title break-words">{titulo}</h1>
                <p className="type-form mt-4 text-secondary">
                  Reserva tu cita en menos de un minuto. Sin crear cuenta.
                </p>
              </div>
            </header>

            {citaActiva && (
              <Link
                to={`/cita/${citaActiva.token}`}
                className="flex min-h-[var(--height-button-compact)] items-center justify-between gap-3 rounded-[var(--radius-card)] border border-amber-30 bg-amber-10 px-4 py-3 text-amber transition-colors hover:border-amber-40"
              >
                <span className="type-small">
                  Tienes una cita pendiente <span aria-hidden="true">·</span>{' '}
                  <span className="font-medium underline underline-offset-2">
                    Ver estado
                  </span>
                </span>
                <ArrowRight aria-hidden="true" size={16} strokeWidth={1.6} />
              </Link>
            )}

            {!barbero.reservasDisponibles ? (
              <p
                role="status"
                className="type-small rounded-[var(--radius-warning)] border border-amber-30 bg-amber-10 p-[var(--space-warning)] text-amber"
              >
                Las reservas no están disponibles por ahora.
              </p>
            ) : (
              <>
                <section aria-labelledby="paso-servicios" className="flex flex-col gap-4">
                  <h2 id="paso-servicios" className="type-eyebrow">
                    1 · SERVICIOS
                  </h2>
                  <div className="flex flex-col gap-3">
                    {barbero.servicios.map((servicio) => (
                      <TarjetaServicio
                        key={servicio.id}
                        servicio={servicio}
                        seleccionado={form.serviciosTitular.includes(servicio.id)}
                        onAlternar={() =>
                          despachar({
                            tipo: 'alternar-servicio-titular',
                            servicioId: servicio.id,
                          })
                        }
                      />
                    ))}
                  </div>
                </section>

                <section aria-labelledby="paso-personas" className="flex flex-col gap-4">
                  <h2 id="paso-personas" className="type-eyebrow">
                    2 · ¿VAS SOLO?
                  </h2>
                  <Segmented
                    etiqueta="¿Vas solo?"
                    valor={form.modo}
                    onCambio={(modo) => despachar({ tipo: 'cambiar-modo', modo })}
                    opciones={[
                      { valor: 'solo', etiqueta: 'Voy solo' },
                      { valor: 'acompanantes', etiqueta: 'Con acompañantes' },
                    ]}
                  />

                  {form.modo === 'acompanantes' && (
                    <>
                      <div className="flex flex-col gap-3">
                        {form.acompanantes.map((acompanante, indice) => (
                          <SelectorServiciosAcompanante
                            key={acompanante.id}
                            numero={indice + 1}
                            servicioIds={acompanante.servicioIds}
                            catalogo={barbero.servicios}
                            onAlternar={(servicioId) =>
                              despachar({
                                tipo: 'alternar-servicio-acompanante',
                                id: acompanante.id,
                                servicioId,
                              })
                            }
                            onQuitar={() =>
                              despachar({
                                tipo: 'quitar-acompanante',
                                id: acompanante.id,
                              })
                            }
                          />
                        ))}
                      </div>

                      {puedeAgregarAcompanante(form) && (
                        <Button
                          variante="ghost"
                          tamano="compacto"
                          icono={<Plus aria-hidden="true" size={16} strokeWidth={1.6} />}
                          onClick={() => despachar({ tipo: 'agregar-acompanante' })}
                          className="self-start"
                        >
                          Agregar otro
                        </Button>
                      )}

                      <p className="type-helper">
                        Los acompañantes suman tiempo real de agenda. Máximo{' '}
                        {MAXIMO_PERSONAS} personas contando al titular.
                      </p>
                    </>
                  )}
                </section>

                <section aria-labelledby="paso-fecha" className="flex flex-col gap-4">
                  <h2 id="paso-fecha" className="type-eyebrow">
                    3 · FECHA Y HORA
                  </h2>

                  <DiaSelector
                    dias={dias}
                    valor={form.fecha}
                    onCambio={(fecha) => despachar({ tipo: 'cambiar-fecha', fecha })}
                  />

                  {hayServiciosTitular && (
                    <p className="type-small text-secondary">
                      Duración total ·{' '}
                      <span className="font-mono text-text">
                        {totales.duracionMinutos} min
                      </span>
                    </p>
                  )}

                  {!hayServiciosTitular ? (
                    <EmptyState titulo="Elige al menos un servicio para ver los horarios disponibles." />
                  ) : !duracionValida ? (
                    <p
                      role="status"
                      className="type-small rounded-[var(--radius-warning)] border border-amber-30 bg-amber-10 p-[var(--space-warning)] text-amber"
                    >
                      La duración total debe estar entre 5 y 600 minutos.
                    </p>
                  ) : disponibilidad.isPending ? (
                    <div>
                      <div className="grid grid-cols-4 gap-2" aria-hidden="true">
                        {Array.from({ length: 8 }, (_, indice) => (
                          <Skeleton key={indice} className="h-[var(--height-button-slot)]" />
                        ))}
                      </div>
                      <span className="sr-only">Cargando horarios</span>
                    </div>
                  ) : disponibilidad.isError ? (
                    <EmptyState
                      titulo="No pudimos cargar los horarios"
                      descripcion="Inténtalo de nuevo."
                      accion={
                        <Button
                          onClick={() => void disponibilidad.refetch()}
                          tamano="compacto"
                        >
                          Reintentar
                        </Button>
                      }
                    />
                  ) : slots.length === 0 ? (
                    <EmptyState titulo="Este día no hay horarios disponibles" />
                  ) : (
                    <>
                      <div
                        className="grid grid-cols-4 gap-2"
                        role="group"
                        aria-label="Horarios disponibles"
                      >
                        {slots.map((slot) => (
                          <SlotButton
                            key={slot.horaInicio}
                            slot={slot}
                            seleccionado={horaEfectiva === slot.horaInicio}
                            onSeleccionar={(horaInicio) =>
                              despachar({ tipo: 'seleccionar-hora', horaInicio })
                            }
                          />
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="type-helper flex items-center gap-2">
                          <span className="size-2 rounded-full bg-green" aria-hidden="true" />
                          Libre
                        </span>
                        <span className="type-helper flex items-center gap-2">
                          <span className="size-2 rounded-full bg-amber" aria-hidden="true" />
                          Por confirmar
                        </span>
                        <span className="type-helper flex items-center gap-2">
                          <span className="size-2 rounded-full bg-red" aria-hidden="true" />
                          Ocupado
                        </span>
                      </div>
                    </>
                  )}
                </section>

                <section aria-labelledby="paso-datos" className="flex flex-col gap-4">
                  <h2 id="paso-datos" className="type-eyebrow">
                    4 · TUS DATOS
                  </h2>

                  <Input
                    etiqueta="Nombre"
                    name="nombre"
                    value={form.datos.nombre}
                    onChange={(evento) => cambiarDato('nombre', evento.target.value)}
                    onBlur={() => marcarTocado('nombre')}
                    error={tocados.nombre ? errores.nombre : undefined}
                    autoComplete="name"
                    maxLength={100}
                    placeholder="Tu nombre"
                  />
                  <Input
                    etiqueta="Celular"
                    name="celular"
                    value={form.datos.celular}
                    onChange={(evento) => cambiarDato('celular', evento.target.value)}
                    onBlur={() => marcarTocado('celular')}
                    error={tocados.celular ? errores.celular : undefined}
                    ayuda="Ejemplo 3001234567. Puedes escribir +57 y espacios."
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={20}
                    placeholder="3001234567"
                  />
                  <Input
                    etiqueta="Correo (opcional)"
                    name="correo"
                    type="email"
                    value={form.datos.correo}
                    onChange={(evento) => cambiarDato('correo', evento.target.value)}
                    onBlur={() => marcarTocado('correo')}
                    error={tocados.correo ? errores.correo : undefined}
                    ayuda="Opcional. Si lo escribes, debe ser válido."
                    inputMode="email"
                    autoComplete="email"
                    maxLength={150}
                    placeholder="tu@correo.com"
                  />
                </section>

                {errorEnvio && (
                  <p
                    role="alert"
                    className="type-small rounded-[var(--radius-warning)] border border-red-30 bg-red-10 p-[var(--space-warning)] text-red"
                  >
                    {errorEnvio}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {barbero.reservasDisponibles && (
          <footer className="sticky bottom-0 z-30 border-t border-line bg-nav px-[var(--space-screen-x)] pb-[calc(var(--space-screen-bottom)+env(safe-area-inset-bottom))] pt-[var(--space-gap-lg)] backdrop-blur-[var(--blur-nav)]">
            <div className="mx-auto flex w-full max-w-[520px] flex-col gap-3">
              <div className="flex items-baseline justify-between gap-4">
                <span className="type-small text-secondary">Total en persona</span>
                <Money monto={totales.montoTotal} tamano="destacado" />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!formularioValido || mutacion.isPending}
                cargando={mutacion.isPending}
              >
                Solicitar cita
              </Button>

              <p className="type-helper text-center">
                Sin pago en línea. El barbero aceptará o rechazará tu solicitud.
              </p>
            </div>
          </footer>
        )}
      </form>
    </main>
  )
}

// Se exporta al final para que el chunk público la cargue desde PublicZone.
export { ReservaPage }
