import { Check, Clock, Copy, UserX, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import { fechaLarga, hora12 } from '@/shared/lib/fechas'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Money } from '@/shared/ui/Money'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useToast } from '@/shared/ui/toast-context'
import { obtenerCitaGuardadaPorToken } from './almacenamientoCitas'
import { copiarTexto } from './copiarEnlace'
import {
  esError404,
  etiquetaMotivoRechazo,
  infoEstadoSeguimiento,
  type ColorSeguimiento,
  type IconoSeguimiento,
} from './domain'
import { useSeguimiento } from './hooks'
import type { SeguimientoCita } from './types'

const CLASES_COLOR: Record<ColorSeguimiento, string> = {
  ambar: 'border-amber-40 bg-amber-10 text-amber',
  verde: 'border-green-40 bg-green-10 text-green',
  rojo: 'border-red-40 bg-red-10 text-red',
  gris: 'border-line bg-white-5 text-dim',
}

function IconoEstado({ icono }: { icono: IconoSeguimiento }) {
  if (icono === 'check') {
    return <Check aria-hidden="true" size={26} strokeWidth={1.6} />
  }
  if (icono === 'cruz') {
    return <X aria-hidden="true" size={26} strokeWidth={1.6} />
  }
  if (icono === 'usuario-x') {
    return <UserX aria-hidden="true" size={26} strokeWidth={1.6} />
  }
  return <Clock aria-hidden="true" size={26} strokeWidth={1.6} />
}

function SeguimientoPage() {
  useTituloPagina()
  const { token: parametro = '' } = useParams()
  const token = parametro.trim()

  return <ContenidoSeguimiento key={token} token={token} />
}

function ContenidoSeguimiento({ token }: { token: string }) {
  const consulta = useSeguimiento(token)

  if (consulta.isPending) return <SeguimientoCargando />

  if (consulta.isError) {
    if (esError404(consulta.error)) return <CitaNoEncontrada />
    return (
      <ErrorCargaCita onReintentar={() => void consulta.refetch()} />
    )
  }

  return <DetalleSeguimiento token={token} cita={consulta.data} />
}

function DetalleSeguimiento({
  token,
  cita,
}: {
  token: string
  cita: SeguimientoCita
}) {
  const navegar = useNavigate()
  const { mostrarToast } = useToast()
  const [copiando, setCopiando] = useState(false)
  const info = infoEstadoSeguimiento(cita.estado)
  const enlace = `${window.location.origin}/cita/${token}`
  const codigo = useMemo(
    () => obtenerCitaGuardadaPorToken(token)?.codigo ?? null,
    [token],
  )

  const motivo = cita.motivoRechazo
    ? etiquetaMotivoRechazo(cita.motivoRechazo)
    : cita.motivoCancelacion

  async function copiarEnlace() {
    setCopiando(true)
    const copiado = await copiarTexto(enlace)
    setCopiando(false)
    mostrarToast({
      mensaje: copiado ? 'Enlace copiado.' : 'No pudimos copiar el enlace.',
    })
  }

  function cerrar() {
    navegar(codigo ? `/b/${encodeURIComponent(codigo)}` : '/b')
  }

  return (
    <main className="px-[var(--space-screen-x)] pb-[calc(var(--space-screen-bottom)+env(safe-area-inset-bottom))] pt-[calc(var(--space-confirm-top)+env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-[520px] flex-col items-center">
        <span
          aria-hidden="true"
          className={`flex size-[var(--size-avatar)] items-center justify-center rounded-[var(--radius-pill)] border ${CLASES_COLOR[info.color]}`}
        >
          <IconoEstado icono={info.icono} />
        </span>

        <h1 className="type-screen-title mt-5 text-center">{info.titulo}</h1>

        <p className="mt-4 text-center text-[var(--font-size-message)] leading-relaxed text-text">
          {cita.mensaje}
        </p>

        {info.nota && (
          <p className="type-helper mt-3 text-center text-amber">{info.nota}</p>
        )}

        <section
          aria-label="Detalle de la cita"
          className="mt-8 w-full rounded-[var(--radius-card)] border border-line bg-card p-[var(--space-card)]"
        >
          <dl className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <dt className="type-helper">Fecha</dt>
              <dd className="type-small text-right text-text">
                {fechaLarga(cita.fecha)}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <dt className="type-helper">Hora</dt>
              <dd className="font-mono text-[var(--font-size-small)] text-text">
                {hora12(cita.horaInicio)} – {hora12(cita.horaFin)}
              </dd>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <dt className="type-helper">Total a pagar en persona</dt>
              <dd>
                <Money monto={cita.montoTotal} tamano="destacado" />
              </dd>
            </div>

            {motivo && (
              <div className="flex items-start justify-between gap-4 border-t border-line pt-4">
                <dt className="type-helper">Motivo</dt>
                <dd className="type-small text-right text-text">{motivo}</dd>
              </div>
            )}
          </dl>
        </section>

        <section
          aria-label="Enlace de seguimiento"
          className="mt-6 w-full rounded-[var(--radius-card)] border border-line bg-card p-[var(--space-card)]"
        >
          <p className="type-label">ENLACE DE SEGUIMIENTO</p>
          <p
            className="mt-2 truncate font-mono text-[var(--font-size-tiny)] text-secondary"
            title={enlace}
          >
            {enlace}
          </p>
          <Button
            variante="ghost"
            tamano="compacto"
            className="mt-3"
            cargando={copiando}
            icono={<Copy aria-hidden="true" size={17} strokeWidth={1.6} />}
            onClick={() => void copiarEnlace()}
          >
            Copiar enlace
          </Button>
        </section>

        <Button className="mt-6 w-full" onClick={cerrar}>
          Cerrar
        </Button>
      </div>
    </main>
  )
}

function SeguimientoCargando() {
  return (
    <main className="px-[var(--space-screen-x)] pb-[var(--space-screen-bottom)] pt-[calc(var(--space-confirm-top)+env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-[520px] flex-col items-center">
        <Skeleton className="size-[var(--size-avatar)]" pildora />
        <Skeleton className="mt-6 h-9 w-3/4" />
        <Skeleton className="mt-4 h-5 w-full" />
        <Skeleton className="mt-2 h-5 w-2/3" />
        <Skeleton className="mt-8 h-48 w-full" />
      </div>
    </main>
  )
}

function CitaNoEncontrada() {
  return (
    <main className="px-[var(--space-screen-x)] pb-[var(--space-screen-bottom)] pt-[calc(var(--space-confirm-top)+env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-[520px]">
        <EmptyState
          titulo="No encontramos esta cita"
          descripcion="Revisa el enlace e inténtalo de nuevo."
        />
      </div>
    </main>
  )
}

function ErrorCargaCita({ onReintentar }: { onReintentar: () => void }) {
  return (
    <main className="px-[var(--space-screen-x)] pb-[var(--space-screen-bottom)] pt-[calc(var(--space-confirm-top)+env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-[520px]">
        <EmptyState
          titulo="No pudimos cargar esta cita"
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

export { SeguimientoPage }
