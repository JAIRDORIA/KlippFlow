import {
  CLAVE_SESION_BARBERO,
  cerrarSesionLocal,
} from '@/shared/api/almacenamientoSesion'
import type { PayloadJwt, SesionBarbero, TipoToken } from './types'

interface SesionGuardada {
  accessToken?: unknown
  nombre?: unknown
  username?: unknown
  nombreBarberia?: unknown
}

function decodificarBase64Url(segmento: string): string {
  const base64 = segmento.replace(/-/g, '+').replace(/_/g, '/')
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
  const binario = window.atob(base64 + relleno)
  const bytes = Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * Lee `tipo` y `exp` SOLO para decidir si la sesión sigue vigente en la UI.
 * Nunca se usa como prueba de autorización: el backend valida la firma.
 */
export function leerPayloadJwt(token: string): PayloadJwt | null {
  try {
    const segmentos = token.split('.')
    if (segmentos.length < 2 || !segmentos[1]) return null
    const datos: unknown = JSON.parse(decodificarBase64Url(segmentos[1]))
    if (typeof datos !== 'object' || datos === null) return null

    const payload = datos as Record<string, unknown>
    const tipo =
      payload.tipo === 'barbero' || payload.tipo === 'admin' || payload.tipo === 'cliente'
        ? payload.tipo
        : undefined

    return {
      sub: typeof payload.sub === 'number' ? payload.sub : undefined,
      tipo,
      username: typeof payload.username === 'string' ? payload.username : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    }
  } catch {
    return null
  }
}

/** Vigencia local (UI). El backend siempre vuelve a validar el token. */
export function tokenVigente(
  token: string,
  tipo: TipoToken,
  ahoraMs: number = Date.now(),
): boolean {
  const payload = leerPayloadJwt(token)
  if (!payload?.tipo || payload.tipo !== tipo) return false
  if (typeof payload.exp !== 'number') return false
  return payload.exp * 1000 > ahoraMs
}

export function cargarSesionBarbero(ahoraMs: number = Date.now()): SesionBarbero | null {
  if (typeof window === 'undefined') return null

  try {
    const crudo = window.localStorage.getItem(CLAVE_SESION_BARBERO)
    if (!crudo) return null

    const datos: unknown = JSON.parse(crudo)
    if (typeof datos !== 'object' || datos === null) return null
    const guardada = datos as SesionGuardada
    if (typeof guardada.accessToken !== 'string') return null
    if (!tokenVigente(guardada.accessToken, 'barbero', ahoraMs)) {
      window.localStorage.removeItem(CLAVE_SESION_BARBERO)
      return null
    }

    return {
      accessToken: guardada.accessToken,
      nombre: typeof guardada.nombre === 'string' ? guardada.nombre : '',
      username: typeof guardada.username === 'string' ? guardada.username : '',
      nombreBarberia:
        typeof guardada.nombreBarberia === 'string' ? guardada.nombreBarberia : null,
    }
  } catch {
    window.localStorage.removeItem(CLAVE_SESION_BARBERO)
    return null
  }
}

export function guardarSesionBarbero(sesion: SesionBarbero): void {
  window.localStorage.setItem(CLAVE_SESION_BARBERO, JSON.stringify(sesion))
}

export function borrarSesionBarbero(motivo: 'manual' | 'expirada' | 'cuenta-no-activa' = 'manual'): void {
  cerrarSesionLocal('barbero', motivo)
}
