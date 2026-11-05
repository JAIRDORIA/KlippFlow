import { peticion } from '@/shared/api/client'
import type {
  OpcionesLoginPasskey,
  OpcionesRegistroPasskey,
  PasskeyCliente,
  RegistroPasskeyResponse,
  RespuestaLoginPasskey,
  VerificarLoginPasskeyBody,
  VerificarRegistroPasskeyBody,
} from './types'

/**
 * Endpoints de passkeys de cliente.
 * Fuente: `docs/backend/PASSKEYS.md`.
 */
export function obtenerOpcionesRegistro(): Promise<OpcionesRegistroPasskey> {
  return peticion<OpcionesRegistroPasskey>('/cliente/passkeys/registro/opciones', {
    metodo: 'POST',
    zona: 'cliente',
  })
}

export function verificarRegistro(
  cuerpo: VerificarRegistroPasskeyBody,
): Promise<RegistroPasskeyResponse> {
  return peticion<RegistroPasskeyResponse>('/cliente/passkeys/registro/verificar', {
    metodo: 'POST',
    cuerpo,
    zona: 'cliente',
  })
}

export function listarPasskeys(): Promise<PasskeyCliente[]> {
  return peticion<PasskeyCliente[]>('/cliente/passkeys', { zona: 'cliente' })
}

export async function eliminarPasskey(id: number): Promise<void> {
  await peticion<void>(`/cliente/passkeys/${encodeURIComponent(String(id))}`, {
    metodo: 'DELETE',
    zona: 'cliente',
  })
}

export function obtenerOpcionesLogin(): Promise<OpcionesLoginPasskey> {
  return peticion<OpcionesLoginPasskey>('/auth/passkey/opciones', {
    metodo: 'POST',
    zona: 'publico',
    redirigirEn401: false,
  })
}

export function verificarLogin(
  cuerpo: VerificarLoginPasskeyBody,
): Promise<RespuestaLoginPasskey> {
  return peticion<RespuestaLoginPasskey>('/auth/passkey/verificar', {
    metodo: 'POST',
    cuerpo,
    zona: 'publico',
    redirigirEn401: false,
  })
}
