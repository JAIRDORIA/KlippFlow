import { ArrowRight, Check, Plus } from 'lucide-react'
import {
  useCallback,
  useMemo,
  useReducer,
  useState,
  type FormEvent,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import type { UsuarioSesionCliente } from '@/features/auth/types'
import { useAuth } from '@/features/auth/useAuth'
import {
  mapearErrorCreacionCliente,
  mapearErrorPerfil,
} from '@/features/cuentas-cliente/domain/errores'
import { validarPerfilCliente } from '@/features/cuentas-cliente/domain/validadores'
import {
  useActualizarPerfil,
  useCrearCitaCliente,
} from '@/features/cuentas-cliente/hooks'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { Logo } from '@/shared/ui/Logo'
import { Money } from '@/shared/ui/Money'
import { Segmented } from '@/shared/ui/Segmented'
import { Sheet } from '@/shared/ui/Sheet'
import { Skeleton } from '@/shared/ui/Skeleton'
import { guardarCitaCliente } from './almacenamientoCitas'
import { DiaSelector } from './components/DiaSelector'
import { SelectorServiciosAcompanante } from './components/SelectorServiciosAcompanante'
import { SlotButton } from './components/SlotButton'
import { TarjetaServicio } from './components/TarjetaServicio'
import {
  calcularTotales,
  esDuracionValida,
  esError404,
  generarDiasDisponibles,
  horaSigueDisponible,
  MAXIMO_PERSONAS,
  puedeAgregarAcompanante,
  reducerFormularioReserva,
  seleccionParaTotales,
} from './domain'
import type { AccionFormularioReserva } from './domain/formulario'
import {
  construirCuerpoCitaCliente,
  crearEstadoInicial,
  esFormularioClienteValido,
} from './domain/formulario'
import {
  useBarberoPublico,
  useCitaActiva,
  useDisponibilidad,
} from './hooks'
import { hoyBogota } from '@/shared/lib/fechas'
import type { BarberoPublico, CitaCreada } from './types'
import { useDebouncedValue } from './useDebouncedValue'

function tituloDeBarbero(barbero: BarberoPublico): string {
  return barbero.nombreBarberia
    ? `${barbero.nombres} · ${barbero.nombreBarberia}`
    : barbero.nombres
}

function ReservaPage() {
  const { codigo: parametro = '' } = useParams()
  const codigo = parametro.trim().toUpperCase()

  return <ContenidoReserva key={codigo} codigo={codigo} />
}

function ContenidoReserva({ codigo }: { codigo: string }) {
  const consulta = useBarberoPublico(codigo)
  useTituloPagina({
    barberia: consulta.data?.nombreBarberia ?? consulta.data?.nombres ?? null,
  })
  const { sesion, cerrarSesion } = useAuth()

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

  if (!sesion) {
    return <ReservaSinSesion codigo={codigo} barbero={consulta.data} />
  }

  if (sesion.usuario.tipo === 'barbero') {
    return (
      <ReservaSesionBarbero
        barbero={consulta.data}
        onCerrarSesion={cerrarSesion}
      />
    )
  }

  return (
    <FormularioReserva
      codigo={codigo}
      barbero={consulta.data}
      cliente={sesion.usuario}
    />
  )
}

function EncabezadoPublico({
  barbero,
  subtitulo,
}: {
  barbero: BarberoPublico
  subtitulo: string
}) {
  return (
    <header className="flex flex-col gap-4">
      <Logo tamano="sm" />
      <div>
        <h1 className="type-public-title break-words">
          {tituloDeBarbero(barbero)}
        </h1>
        <p className="type-form mt-4 text-secondary">{subtitulo}</p>
      </div>
    </header>
  )
}

function ReservaSinSesion({
  codigo,
  barbero,
}: {
  codigo: string
  barbero: BarberoPublico
}) {
  const volver = `/b/${encodeURIComponent(codigo)}`

  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-10">
        <EncabezadoPublico
          barbero={barbero}
          subtitulo="Reserva tu cita en menos de un minuto."
        />

        <Card className="flex flex-col gap-5">
          <p className="type-form text-secondary">
            Inicia sesión o crea tu cuenta para reservar
          </p>
          <Link
            to={`/login?volver=${encodeURIComponent(volver)}`}
            className="inline-flex min-h-[var(--height-button)] w-full items-center justify-center rounded-[var(--radius-button)] bg-accent px-[var(--padding-button-x)] text-[var(--font-size-form)] font-semibold text-ink transition-colors hover:bg-white"
          >
            Iniciar sesión o crear cuenta
          </Link>
        </Card>
      </div>
    </main>
  )
}

function ReservaSesionBarbero({
  barbero,
  onCerrarSesion,
}: {
  barbero: BarberoPublico
  onCerrarSesion: () => Promise<void>
}) {
  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-10">
        <EncabezadoPublico
          barbero={barbero}
          subtitulo="Reserva tu cita en menos de un minuto."
        />

        <Card className="flex flex-col gap-5">
          <p className="type-form text-secondary">
            Estás con tu sesión de barbero. Cierra sesión para reservar como
            cliente.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/app"
              className="inline-flex min-h-[var(--height-button)] items-center justify-center rounded-[var(--radius-button)] border border-line px-[var(--padding-button-x)] text-[var(--font-size-form)] font-semibold text-text transition-colors hover:bg-white-5"
            >
              Ir a mi panel
            </Link>
            <Button
              variante="ghost"
              className="w-full"
              onClick={() => void onCerrarSesion()}
            >
              Cerrar sesión
            </Button>
          </div>
          <p className="type-helper">
            Después de cerrar sesión podrás entrar con tu cuenta de cliente y
            reservar en esta misma barbería.
          </p>
        </Card>
      </div>
    </main>
  )
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
        <Logo tamano="sm" />
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
        <Logo tamano="sm" />
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

function ConfirmacionCita({ cita }: { cita: CitaCreada }) {
  const navegar = useNavigate()

  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[520px] flex-col items-center text-center">
        <Logo tamano="sm" />
        <span className="mt-10 inline-flex size-[var(--size-avatar)] items-center justify-center rounded-full border border-green-40 bg-green-10 text-green">
          <Check aria-hidden="true" size={26} strokeWidth={1.6} />
        </span>
        <h1 className="type-public-title mt-6">Cita creada</h1>
        <p className="type-form mt-4 max-w-[360px] text-secondary">
          {cita.mensaje}
        </p>
        <p className="type-small mt-3 text-amber">
          Espera a que el barbero acepte tu solicitud
        </p>
        <Button className="mt-8 w-full max-w-[320px]" onClick={() => navegar('/mi')}>
          Ir a mis citas
        </Button>
      </div>
    </main>
  )
}

function FormularioReserva({
  codigo,
  barbero,
  cliente,
}: {
  codigo: string
  barbero: BarberoPublico
  cliente: UsuarioSesionCliente
}) {
  const dias = useMemo(() => generarDiasDisponibles(), [])
  const fechaInicial = dias[0]?.fecha ?? ''
  const [form, dispatch] = useReducer(
    reducerFormularioReserva,
    fechaInicial,
    crearEstadoInicial,
  )
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [citaCreada, setCitaCreada] = useState<CitaCreada | null>(null)
  const [sheetAbierto, setSheetAbierto] = useState(false)
  const [nombrePerfil, setNombrePerfil] = useState(cliente.nombre)
  const [celularPerfil, setCelularPerfil] = useState(cliente.celular)
  const [tocadosPerfil, setTocadosPerfil] = useState({
    nombre: false,
    celular: false,
  })
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null)

  const mutacion = useCrearCitaCliente(codigo)
  const mutacionPerfil = useActualizarPerfil()
  // Aviso validado contra el servidor: desaparece cuando la cita ya terminó.
  const citaActiva = useCitaActiva(codigo, hoyBogota())

  const cerrarSheet = useCallback(() => setSheetAbierto(false), [])
  const abrirSheet = useCallback(() => {
    setNombrePerfil(cliente.nombre)
    setCelularPerfil(cliente.celular)
    setTocadosPerfil({ nombre: false, celular: false })
    setErrorPerfil(null)
    setSheetAbierto(true)
  }, [cliente.nombre, cliente.celular])

  const totales = calcularTotales(seleccionParaTotales(form), barbero.servicios)
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
  const formularioValido = esFormularioClienteValido(
    { ...form, horaInicio: horaEfectiva },
    barbero.servicios,
  )

  const erroresPerfil = validarPerfilCliente({
    nombre: nombrePerfil,
    celular: celularPerfil,
  })
  const perfilValido = !erroresPerfil.nombre && !erroresPerfil.celular

  function despachar(accion: AccionFormularioReserva) {
    setErrorEnvio(null)
    dispatch(accion)
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!formularioValido || !horaEfectiva || mutacion.isPending) return

    const cuerpo = construirCuerpoCitaCliente(
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
        setCitaCreada(cita)
      },
      onError: (error) => {
        const mapeado = mapearErrorCreacionCliente(error)
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

  function guardarPerfil() {
    if (!perfilValido || mutacionPerfil.isPending) return
    setErrorPerfil(null)
    mutacionPerfil.mutate(
      { nombre: nombrePerfil.trim(), celular: celularPerfil },
      {
        onSuccess: () => setSheetAbierto(false),
        onError: (fallo) => setErrorPerfil(mapearErrorPerfil(fallo)),
      },
    )
  }

  if (citaCreada) return <ConfirmacionCita cita={citaCreada} />

  return (
    <main className="flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <form onSubmit={enviar} className="flex flex-1 flex-col" noValidate>
        <div className="screen flex-1">
          <div className="mx-auto flex w-full max-w-[520px] flex-col gap-10">
            <EncabezadoPublico
              barbero={barbero}
              subtitulo="Reserva tu cita en menos de un minuto."
            />

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

            <div className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-card px-4 py-3">
              <p className="type-small min-w-0">
                Reservarás como{' '}
                <span className="font-medium text-text">{cliente.nombre}</span>{' '}
                <span aria-hidden="true">·</span>{' '}
                <span className="font-mono text-text">{cliente.celular}</span>
              </p>
              <Button
                variante="ghost"
                tamano="compacto"
                className="shrink-0"
                onClick={abrirSheet}
              >
                Cambiar
              </Button>
            </div>

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

      <Sheet
        abierto={sheetAbierto}
        onCerrar={cerrarSheet}
        titulo="Cambiar datos"
        descripcion="Actualiza tu nombre y celular para esta y tus próximas reservas."
        pie={
          <Button
            className="w-full"
            onClick={guardarPerfil}
            disabled={!perfilValido || mutacionPerfil.isPending}
            cargando={mutacionPerfil.isPending}
          >
            Guardar
          </Button>
        }
      >
        <div className="flex flex-col gap-5">
          <Input
            etiqueta="Nombre"
            name="perfil-nombre"
            value={nombrePerfil}
            onChange={(evento) => {
              setNombrePerfil(evento.target.value)
              setErrorPerfil(null)
            }}
            onBlur={() => setTocadosPerfil((actual) => ({ ...actual, nombre: true }))}
            error={
              tocadosPerfil.nombre || nombrePerfil.length > 0
                ? erroresPerfil.nombre
                : undefined
            }
            autoComplete="name"
            maxLength={100}
            placeholder="Tu nombre"
          />
          <Input
            etiqueta="Celular"
            name="perfil-celular"
            value={celularPerfil}
            onChange={(evento) => {
              setCelularPerfil(evento.target.value)
              setErrorPerfil(null)
            }}
            onBlur={() => setTocadosPerfil((actual) => ({ ...actual, celular: true }))}
            error={
              tocadosPerfil.celular || celularPerfil.length > 0
                ? erroresPerfil.celular
                : undefined
            }
            ayuda="Ejemplo 3001234567. Puedes escribir +57 y espacios."
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            placeholder="3001234567"
          />

          {errorPerfil && (
            <p
              role="alert"
              className="type-small rounded-[var(--radius-warning)] border border-red-30 bg-red-10 p-[var(--space-warning)] text-red"
            >
              {errorPerfil}
            </p>
          )}
        </div>
      </Sheet>
    </main>
  )
}

// Se exporta al final para que el chunk público la cargue desde PublicZone.
export { ReservaPage }
