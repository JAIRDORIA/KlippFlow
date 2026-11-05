import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotificaciones } from '@/features/notificaciones/hooks'
import { almacenDelNavegador } from '@/features/notificaciones/domain/onboarding'
import {
  estadoPermiso,
  leerEntornoDispositivo,
  plataformaPush,
} from '@/features/notificaciones/domain/plataforma'
import { useInstalarAndroid } from '@/features/pwa/useInstalarAndroid'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { cn } from '@/shared/lib/cn'
import { descarteAvisoVigente, guardarDescarteAviso } from '../domain/avisoApp'

export interface AvisoActivarAppProps {
  contexto: 'mi' | 'confirmacion'
  clienteId: number
}

const MENSAJE_DENEGADO =
  'Las notificaciones están bloqueadas. Actívalas en los ajustes del navegador o de la app.'
const MENSAJE_SIN_SOPORTE =
  'Tu navegador no admite notificaciones. Revisa el estado de tu cita en Mis citas.'

/**
 * Matriz de avisos de instalación/notificaciones del cliente.
 *
 * - En /mi se puede descartar por 7 días (localStorage por cliente).
 * - En la confirmación de reserva se muestra destacado y sin descarte.
 */
export function AvisoActivarApp({
  contexto,
  clienteId,
}: AvisoActivarAppProps) {
  const entorno = useMemo(() => leerEntornoDispositivo(), [])
  const plataforma = useMemo(() => plataformaPush(entorno), [entorno])
  const permiso = useMemo(() => estadoPermiso(entorno), [entorno])
  const { activar, ocupado, error, estado } = useNotificaciones('cliente')
  const { puedeInstalar, instalar } = useInstalarAndroid()
  const [descartado, setDescartado] = useState(() =>
    descarteAvisoVigente(clienteId, almacenDelNavegador()),
  )

  const destacado = contexto === 'confirmacion'
  const descartable = contexto === 'mi' && !descartado

  function descartar() {
    guardarDescarteAviso(clienteId, almacenDelNavegador())
    setDescartado(true)
  }

  if (estado === 'error') {
    return (
      <Card className={cn('flex flex-col gap-4', destacado && 'ring-4 ring-accent-20')}>
        <p className="type-card-title">No pudimos activar las notificaciones</p>
        <p aria-live="polite" className="type-helper text-red">
          {error ?? 'Inténtalo de nuevo.'}
        </p>
        <Button
          onClick={() => void activar()}
          disabled={ocupado}
          aria-disabled={ocupado || undefined}
          cargando={ocupado}
          className="w-full"
        >
          Reintentar
        </Button>
      </Card>
    )
  }

  if (permiso === 'granted' || estado === 'activo') {
    return contexto === 'mi' ? (
      <p className="type-helper text-green">Notificaciones activas ✓</p>
    ) : null
  }

  if (descartado && contexto === 'mi') return null

  if (plataforma === 'sin-soporte') {
    return (
      <Card className="flex flex-col gap-3">
        <p className="type-card-title">Notificaciones no disponibles</p>
        <p className="type-small text-secondary">{MENSAJE_SIN_SOPORTE}</p>
      </Card>
    )
  }

  if (permiso === 'denied' || estado === 'denegado') {
    return (
      <Card className="flex flex-col gap-3">
        <p className="type-card-title">Notificaciones bloqueadas</p>
        <p aria-live="polite" className="type-small text-secondary">
          {MENSAJE_DENEGADO}
        </p>
      </Card>
    )
  }

  if (plataforma === 'ios-navegador') {
    return (
      <Card
        className={cn(
          'flex flex-col gap-4',
          destacado && 'border-accent-40 ring-4 ring-accent-20',
        )}
      >
        <p className="type-card-title">
          Instala la app para recibir el aviso cuando el barbero responda
        </p>
        <p className="type-small text-secondary">
          Al abrir la app instalada, vuelve a iniciar sesión con tu usuario y
          contraseña.
        </p>
        <Link
          to="/mi/instalar"
          className="kf-press type-form inline-flex min-h-[var(--height-button)] w-full items-center justify-center rounded-[var(--radius-button)] bg-accent px-[var(--padding-button-x)] font-semibold text-ink"
        >
          Ver cómo instalar
        </Link>
        {descartable && (
          <Button variante="ghost" tamano="compacto" onClick={descartar}>
            Ahora no
          </Button>
        )}
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'flex flex-col gap-4',
        destacado && 'border-accent-40 ring-4 ring-accent-20',
      )}
    >
      <p className="type-card-title">
        Activa las notificaciones para saber cuándo el barbero responde
      </p>
      <p className="type-small text-secondary">
        Te avisaremos cuando acepte, rechace o cancele tu solicitud.
      </p>

      <Button
        onClick={() => void activar()}
        disabled={ocupado}
        aria-disabled={ocupado || undefined}
        cargando={ocupado}
        className="w-full"
      >
        Activar notificaciones
      </Button>

      {plataforma === 'android-o-escritorio' && puedeInstalar && (
        <Button
          variante="ghost"
          onClick={() => void instalar()}
          className="w-full"
        >
          Instalar app
        </Button>
      )}

      <div aria-live="polite" className="min-h-0">
        {ocupado && <p className="type-helper text-secondary">Activando…</p>}
      </div>

      {error && (
        <p role="alert" className="type-helper text-red">
          {error}
        </p>
      )}

      {descartable && (
        <Button variante="ghost" tamano="compacto" onClick={descartar}>
          Ahora no
        </Button>
      )}
    </Card>
  )
}
