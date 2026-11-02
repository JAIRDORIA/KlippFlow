import { Link } from 'react-router-dom'
import { useNotificaciones } from '../hooks'
import type { EstadoNotificaciones } from '../types'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'

const ETIQUETAS: Record<EstadoNotificaciones, string> = {
  activo: 'Activas',
  activando: 'Activando…',
  permiso_pendiente: 'Desactivadas',
  denegado: 'Bloqueadas',
  requiere_instalacion: 'Requiere instalar la app',
  no_soportado: 'No disponibles en este navegador',
  error: 'Desactivadas',
}

const DESCRIPCIONES: Record<EstadoNotificaciones, string> = {
  activo: 'Te avisamos al teléfono cada vez que entra una solicitud.',
  activando: 'Estamos activando las notificaciones en este dispositivo.',
  permiso_pendiente: 'Actívalas para enterarte de cada solicitud sin abrir la app.',
  denegado:
    'Las bloqueaste en este navegador. Actívalas desde los ajustes del navegador o del iPhone.',
  requiere_instalacion:
    'En iPhone las notificaciones solo funcionan con la app instalada en la pantalla de inicio (iOS 16.4 o superior).',
  no_soportado:
    'Este navegador no permite notificaciones. Verás las solicitudes al abrir la app.',
  error: 'No se pudieron activar las notificaciones en este dispositivo.',
}

/** Tarjeta "Notificaciones" de Ajustes (DISENO.md 6.9). */
export function TarjetaNotificaciones() {
  const { estado, ocupado, error, activar, desactivar, reintentar } = useNotificaciones()

  return (
    <section className="mt-9">
      <h2 className="type-card-title">Notificaciones</h2>

      <Card className="mt-3 flex flex-col gap-3">
        <p className="type-eyebrow">AVISOS DE NUEVAS SOLICITUDES</p>

        <p aria-live="polite" className="type-form font-medium text-text">
          {ETIQUETAS[estado]}
        </p>

        <p className="type-helper">{DESCRIPCIONES[estado]}</p>

        {error && estado !== 'activo' && (
          <p role="alert" className="type-helper text-red">
            {error}
          </p>
        )}

        {estado === 'permiso_pendiente' && (
          <Button
            onClick={() => void activar()}
            disabled={ocupado}
            aria-disabled={ocupado || undefined}
            cargando={ocupado}
            className="w-full"
          >
            Activar notificaciones
          </Button>
        )}

        {estado === 'error' && (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => void activar()}
              disabled={ocupado}
              aria-disabled={ocupado || undefined}
              cargando={ocupado}
              className="w-full"
            >
              Reintentar
            </Button>
            <Button
              variante="ghost"
              onClick={reintentar}
              disabled={ocupado}
              className="w-full"
            >
              Volver
            </Button>
          </div>
        )}

        {estado === 'activo' && (
          <Button
            variante="ghost"
            onClick={() => void desactivar()}
            disabled={ocupado}
            aria-disabled={ocupado || undefined}
            cargando={ocupado}
            className="w-full"
          >
            Desactivar
          </Button>
        )}

        {estado === 'requiere_instalacion' && (
          <Link
            to="/instalar"
            className="kf-press type-form inline-flex h-[var(--height-button)] w-full items-center justify-center rounded-[var(--radius-button)] bg-transparent font-semibold text-text hover:bg-white-5"
          >
            Ver cómo instalar
          </Link>
        )}
      </Card>
    </section>
  )
}
