/**
 * URL de destino del clic en una notificación.
 *
 * El backend envía `url: "/solicitudes"` (ruta interna del panel). En esta app
 * la pantalla vive en `/app/solicitudes`, así que se traduce.
 *
 * Reglas:
 * - Siempre del mismo origen: lo externo cae en la bandeja de solicitudes.
 * - Solo rutas absolutas internas (`/...`).
 * - Sin URL o URL inválida: `/app/solicitudes`.
 */

import { volverSeguro } from '@/shared/lib/rutas'

export const RUTA_SOLICITUDES = '/app/solicitudes'
export const RUTA_CLIENTE = '/mi'

/** Rutas heredadas del backend → ruta real de esta app. */
const RUTAS_HEREDADAS: Record<string, string> = {
  '/solicitudes': RUTA_SOLICITUDES,
}

export function urlDestinoSegura(
  url: string | null | undefined,
  origen: string,
): string {
  if (!url) return RUTA_SOLICITUDES

  let base: URL
  try {
    base = new URL(origen)
  } catch {
    return RUTA_SOLICITUDES
  }

  let resuelta: URL
  try {
    resuelta = new URL(url, base)
  } catch {
    return RUTA_SOLICITUDES
  }

  if (resuelta.origin !== base.origin) return RUTA_SOLICITUDES
  if (resuelta.protocol !== 'http:' && resuelta.protocol !== 'https:') {
    return RUTA_SOLICITUDES
  }

  const ruta = resuelta.pathname
  if (!ruta.startsWith('/')) return RUTA_SOLICITUDES

  const heredada = RUTAS_HEREDADAS[ruta]
  if (heredada) return heredada

  return `${ruta}${resuelta.search}`
}

/**
 * Destino del push de cliente: misma regla que `volverSeguro` (`/mi`, `/mi/*`,
 * `/b/*`, `/cita/*`). Cualquier URL externa o fuera de esas rutas cae en `/mi`.
 */
export function urlDestinoCliente(url: string | null | undefined): string {
  return volverSeguro(url) ?? RUTA_CLIENTE
}
