import {
  CLAVE_SESION_ADMIN,
  cerrarSesionLocal,
} from '@/shared/api/almacenamientoSesion'
import { tokenVigente } from './sesionBarbero'
import type { SesionAdmin } from './types'

/**
 * Sesión del panel de administración.
 *
 * Clave distinta de la del barbero (`klippflow.admin.sesion`) y validación del
 * `tipo` del JWT: un token de barbero guardado aquí se descarta.
 */

interface SesionGuardada {
  accessToken?: unknown
  id?: unknown
  username?: unknown
  nombre?: unknown
}

export function cargarSesionAdmin(ahoraMs: number = Date.now()): SesionAdmin | null {
  if (typeof window === 'undefined') return null

  try {
    const crudo = window.localStorage.getItem(CLAVE_SESION_ADMIN)
    if (!crudo) return null

    const datos: unknown = JSON.parse(crudo)
    if (typeof datos !== 'object' || datos === null) return null

    const guardada = datos as SesionGuardada
    if (typeof guardada.accessToken !== 'string') return null

    if (!tokenVigente(guardada.accessToken, 'admin', ahoraMs)) {
      window.localStorage.removeItem(CLAVE_SESION_ADMIN)
      return null
    }

    return {
      accessToken: guardada.accessToken,
      id: typeof guardada.id === 'number' ? guardada.id : 0,
      username: typeof guardada.username === 'string' ? guardada.username : '',
      nombre: typeof guardada.nombre === 'string' ? guardada.nombre : '',
    }
  } catch {
    window.localStorage.removeItem(CLAVE_SESION_ADMIN)
    return null
  }
}

export function guardarSesionAdmin(sesion: SesionAdmin): void {
  window.localStorage.setItem(CLAVE_SESION_ADMIN, JSON.stringify(sesion))
}

/** Solo toca la clave del admin; la sesión del barbero queda intacta. */
export function borrarSesionAdmin(motivo: 'manual' | 'expirada' = 'manual'): void {
  cerrarSesionLocal('admin', motivo)
}
