/**
 * Claves de sesión y utilidades mínimas que el cliente HTTP necesita.
 * Hay UNA ranura para barbero/cliente y otra separada para admin.
 */

export type ZonaApi = 'barbero' | 'cliente' | 'admin' | 'publico'
export type ZonaAutenticada = Exclude<ZonaApi, 'publico'>

/** Ranura única de sesión para barbero o cliente. */
export const CLAVE_SESION = 'klippflow.sesion'
export const CLAVE_SESION_ADMIN = 'klippflow.admin.sesion'
/** Clave antigua, solo se elimina para no dejar sesiones duplicadas. */
export const CLAVE_SESION_LEGACY = 'klippflow.barbero.sesion'
export const EVENTO_SESION_CERRADA = 'klippflow:sesion-cerrada'

export interface DetalleSesionCerrada {
  zona: ZonaAutenticada
  motivo: 'expirada' | 'cuenta-no-activa' | 'manual'
}

interface SesionGuardada {
  token?: unknown
  accessToken?: unknown
  tipo?: unknown
}

function claveDeZona(zona: ZonaAutenticada): string {
  return zona === 'admin' ? CLAVE_SESION_ADMIN : CLAVE_SESION
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

  const datos = leerJson(claveDeZona(zona))
  if (zona === 'admin') {
    return typeof datos?.accessToken === 'string' ? datos.accessToken : null
  }

  if (datos?.tipo !== zona) return null
  return typeof datos.token === 'string' ? datos.token : null
}

export function cerrarSesionLocal(
  zona: ZonaAutenticada,
  motivo: DetalleSesionCerrada['motivo'],
): void {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(claveDeZona(zona))
  window.dispatchEvent(
    new CustomEvent<DetalleSesionCerrada>(EVENTO_SESION_CERRADA, {
      detail: { zona, motivo },
    }),
  )
}

/** La zona se deduce de la ruta actual salvo que la petición indique otra. */
export function zonaPorRuta(ruta: string): ZonaApi {
  if (/^\/(public|auth)(\/|$)/.test(ruta)) return 'publico'
  if (/^\/cliente(\/|$)/.test(ruta)) return 'cliente'
  if (typeof window === 'undefined') return 'barbero'
  return window.location.pathname.startsWith('/admin') ? 'admin' : 'barbero'
}

/** Elimina la clave de la versión anterior para que no queden dos ranuras. */
export function limpiarSesionLegacy(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CLAVE_SESION_LEGACY)
}
