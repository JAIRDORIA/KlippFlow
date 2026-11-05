import { urlDestinoCliente, urlDestinoSegura } from './urlDestino'

/**
 * Opciones de la notificación push.
 *
 * Android trata `badge` como una **máscara de alfa**: usa la forma y descarta el
 * color. Por eso el badge es un PNG blanco con transparencia
 * (`public/icons/badge-96.png`, generado con `pnpm badge`); un ícono a color con
 * fondo opaco se ve como un cuadrado blanco.
 *
 * `icon` es el ícono grande a color. Ambas rutas son absolutas desde la raíz
 * para que se resuelvan igual en cualquier pantalla.
 */

export const ICONO_NOTIFICACION = '/icons/icon-192.png'
export const BADGE_NOTIFICACION = '/icons/badge-96.png'

export type ZonaNotificacion = 'barbero' | 'cliente'

export interface OpcionesNotificacion {
  body: string
  icon: string
  badge: string
  tag?: string
  data: { url: string; zona: ZonaNotificacion }
}

export interface PayloadPushBase {
  titulo?: string
  cuerpo?: string
  url?: string
  tag?: string
  tipo?: string
  citaId?: number
}

/** El payload de cliente se reconoce por tipo, citaId o URL de /mi. */
export function esPayloadCliente(payload: PayloadPushBase): boolean {
  if (payload.tipo?.startsWith('cita_')) return true
  if (typeof payload.citaId === 'number') return true
  return payload.url?.startsWith('/mi') === true
}

/** Arma las opciones de `showNotification` y normaliza la URL del clic. */
export function construirOpcionesNotificacion(
  cuerpo: string,
  url: string | null | undefined,
  origen: string,
  tag?: string,
  zona: ZonaNotificacion = 'barbero',
): OpcionesNotificacion {
  const opciones: OpcionesNotificacion = {
    body: cuerpo,
    icon: ICONO_NOTIFICACION,
    badge: BADGE_NOTIFICACION,
    data: {
      url:
        zona === 'cliente'
          ? urlDestinoCliente(url)
          : urlDestinoSegura(url, origen),
      zona,
    },
  }

  if (tag) opciones.tag = tag
  return opciones
}
