/**
 * Claves de sesión y utilidades mínimas que el cliente HTTP necesita.
 * El AuthProvider de barbero valida y administra la sesión; el de admin queda
 * como marcador en una clave separada.
 */

export type ZonaApi = 'barbero' | 'admin' | 'publico'

export const CLAVE_SESION_BARBERO = 'klippflow.barbero.sesion'
export const CLAVE_SESION_ADMIN = 'klippflow.admin.sesion'
export const EVENTO_SESION_CERRADA = 'klippflow:sesion-cerrada'

export interface DetalleSesionCerrada {
  zona: Exclude<ZonaApi, 'publico'>
  motivo: 'expirada' | 'cuenta-no-activa' | 'manual'
}

interface SesionGuardada {
  accessToken?: unknown
}

function leerJson(clave: string): SesionGuardada | null {
  try {
    const crudo = window.localStorage.getItem(clave)
    if (!crudo) return null
    const datos: unknown = JSON.parse(crudo)
    if (typeof datos !== 'object' || datos === null) return null
    return datos as SesionGuardada
  } catch {
    return null
  }
}

export function leerToken(zona: ZonaApi): string | null {
  if (zona === 'publico' || typeof window === 'undefined') return null
  const clave = zona === 'admin' ? CLAVE_SESION_ADMIN : CLAVE_SESION_BARBERO
  const datos = leerJson(clave)
  return typeof datos?.accessToken === 'string' ? datos.accessToken : null
}

export function cerrarSesionLocal(
  zona: Exclude<ZonaApi, 'publico'>,
  motivo: DetalleSesionCerrada['motivo'],
): void {
  if (typeof window === 'undefined') return
  const clave = zona === 'admin' ? CLAVE_SESION_ADMIN : CLAVE_SESION_BARBERO
  window.localStorage.removeItem(clave)
  window.dispatchEvent(
    new CustomEvent<DetalleSesionCerrada>(EVENTO_SESION_CERRADA, {
      detail: { zona, motivo },
    }),
  )
}

/** La zona se deduce de la ruta actual salvo que la petición indique otra. */
export function zonaPorRuta(ruta: string): ZonaApi {
  if (ruta.startsWith('/public') || ruta.startsWith('/auth')) return 'publico'
  if (typeof window === 'undefined') return 'barbero'
  return window.location.pathname.startsWith('/admin') ? 'admin' : 'barbero'
}
