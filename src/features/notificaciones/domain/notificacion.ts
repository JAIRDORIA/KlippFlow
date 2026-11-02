import { urlDestinoSegura } from './urlDestino'

/**
 * Opciones de la notificación push del barbero.
 *
 * Android trata `badge` como una **máscara de alfa**: usa la forma y descarta el
 * color. Por eso el badge es un PNG blanco con transparencia
 * (`public/icons/badge-96.png`, generado con `pnpm badge`); un ícono a color con
 * fondo opaco se ve como un cuadrado blanco.
 *
 * `icon` es el ícono grande a color que ya funcionaba. Ambas rutas son
 * absolutas desde la raíz para que se resuelvan igual en cualquier pantalla.
 */

export const ICONO_NOTIFICACION = '/icons/icon-192.png'
export const BADGE_NOTIFICACION = '/icons/badge-96.png'

export interface OpcionesNotificacion {
  body: string
  icon: string
  badge: string
  data: { url: string }
}

/** Arma las opciones de `showNotification` y normaliza la URL del clic. */
export function construirOpcionesNotificacion(
  cuerpo: string,
  url: string | null | undefined,
  origen: string,
): OpcionesNotificacion {
  return {
    body: cuerpo,
    icon: ICONO_NOTIFICACION,
    badge: BADGE_NOTIFICACION,
    data: { url: urlDestinoSegura(url, origen) },
  }
}
