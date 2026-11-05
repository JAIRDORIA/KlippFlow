import {
  CLAVE_SESION,
  cerrarSesionLocal,
} from '@/shared/api/almacenamientoSesion'
import type { TipoSesion } from '@/shared/lib/rutas'
import type {
  BarberoAutenticado,
  ClienteAutenticado,
  MetodoSesion,
  PayloadJwt,
  PerfilCliente,
  RespuestaLogin,
  RespuestaLoginCliente,
  Sesion,
  TipoToken,
  UsuarioSesion,
  UsuarioSesionBarbero,
  UsuarioSesionCliente,
} from './types'

interface SesionCruda {
  token?: unknown
  tipo?: unknown
  usuario?: unknown
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
    const metodo =
      payload.metodo === 'password' ||
      payload.metodo === 'google' ||
      payload.metodo === 'passkey'
        ? payload.metodo
        : undefined
    const iat = typeof payload.iat === 'number' ? payload.iat : undefined

    return {
      sub: typeof payload.sub === 'number' ? payload.sub : undefined,
      tipo,
      username: typeof payload.username === 'string' ? payload.username : undefined,
      ...(metodo ? { metodo } : {}),
      ...(iat !== undefined ? { iat } : {}),
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

/** `metodo` del JWT; solo para UI, no para autorizar. */
export function metodoDeSesion(token: string): MetodoSesion | null {
  return leerPayloadJwt(token)?.metodo ?? null
}

/**
 * Réplica de la regla del backend (`CUENTAS_CLIENTE.md:264-266`):
 * `contrasenaActual` es obligatoria salvo Google emitido hace ≤ 10 minutos.
 */
export function requiereContrasenaActual(
  token: string,
  ahoraMs: number = Date.now(),
): boolean {
  const payload = leerPayloadJwt(token)
  if (payload?.metodo !== 'google') return true
  if (typeof payload.iat !== 'number') return true

  return ahoraMs / 1000 - payload.iat > 10 * 60
}

function esEstadoCuenta(valor: unknown): valor is BarberoAutenticado['estadoCuenta'] {
  return valor === 'activo' || valor === 'suspendido' || valor === 'vencido'
}

function esUsuarioBarbero(valor: unknown): valor is UsuarioSesionBarbero {
  if (typeof valor !== 'object' || valor === null) return false
  const datos = valor as Record<string, unknown>
  return (
    datos.tipo === 'barbero' &&
    typeof datos.id === 'number' &&
    typeof datos.codigoUnico === 'string' &&
    typeof datos.nombres === 'string' &&
    typeof datos.apellidos === 'string' &&
    (typeof datos.nombreBarberia === 'string' || datos.nombreBarberia === null) &&
    typeof datos.username === 'string' &&
    esEstadoCuenta(datos.estadoCuenta)
  )
}

function esUsuarioCliente(valor: unknown): valor is UsuarioSesionCliente {
  if (typeof valor !== 'object' || valor === null) return false
  const datos = valor as Record<string, unknown>
  return (
    datos.tipo === 'cliente' &&
    typeof datos.id === 'number' &&
    typeof datos.nombre === 'string' &&
    typeof datos.username === 'string' &&
    typeof datos.correo === 'string' &&
    typeof datos.celular === 'string'
  )
}

function esUsuarioSesion(valor: unknown): valor is UsuarioSesion {
  return esUsuarioBarbero(valor) || esUsuarioCliente(valor)
}

export function cargarSesion(ahoraMs: number = Date.now()): Sesion | null {
  if (typeof window === 'undefined') return null

  try {
    const crudo = window.localStorage.getItem(CLAVE_SESION)
    if (!crudo) return null

    const datos: unknown = JSON.parse(crudo)
    if (typeof datos !== 'object' || datos === null) return null

    const guardada = datos as SesionCruda
    if (typeof guardada.token !== 'string') {
      window.localStorage.removeItem(CLAVE_SESION)
      return null
    }
    if (guardada.tipo !== 'barbero' && guardada.tipo !== 'cliente') {
      window.localStorage.removeItem(CLAVE_SESION)
      return null
    }
    if (!esUsuarioSesion(guardada.usuario)) {
      window.localStorage.removeItem(CLAVE_SESION)
      return null
    }
    if (guardada.usuario.tipo !== guardada.tipo) {
      window.localStorage.removeItem(CLAVE_SESION)
      return null
    }
    if (!tokenVigente(guardada.token, guardada.tipo, ahoraMs)) {
      window.localStorage.removeItem(CLAVE_SESION)
      return null
    }

    return {
      token: guardada.token,
      tipo: guardada.tipo,
      usuario: guardada.usuario,
    }
  } catch {
    window.localStorage.removeItem(CLAVE_SESION)
    return null
  }
}

export function guardarSesion(sesion: Sesion): void {
  const limpia: Sesion = {
    token: sesion.token,
    tipo: sesion.tipo,
    usuario: sesion.usuario,
  }
  window.localStorage.setItem(CLAVE_SESION, JSON.stringify(limpia))
}

export function borrarSesion(
  tipo: TipoSesion,
  motivo: 'manual' | 'expirada' | 'cuenta-no-activa' = 'manual',
): void {
  cerrarSesionLocal(tipo, motivo)
}

function usuarioDesdeBarbero(barbero: BarberoAutenticado): UsuarioSesionBarbero {
  return {
    tipo: 'barbero',
    id: barbero.id,
    codigoUnico: barbero.codigoUnico,
    nombres: barbero.nombres,
    apellidos: barbero.apellidos,
    nombreBarberia: barbero.nombreBarberia,
    username: barbero.username,
    estadoCuenta: barbero.estadoCuenta,
  }
}

function usuarioDesdeCliente(cliente: ClienteAutenticado): UsuarioSesionCliente {
  return {
    tipo: 'cliente',
    id: cliente.id,
    nombre: cliente.nombre,
    username: cliente.username,
    correo: cliente.correo,
    celular: cliente.celular,
  }
}

export function sesionDesdeRespuesta(respuesta: RespuestaLogin): Sesion {
  if (respuesta.tipo === 'barbero') {
    return {
      token: respuesta.accessToken,
      tipo: 'barbero',
      usuario: usuarioDesdeBarbero(respuesta.barbero),
    }
  }

  return {
    token: respuesta.accessToken,
    tipo: 'cliente',
    usuario: usuarioDesdeCliente(respuesta.cliente),
  }
}

export function sesionDesdeLoginCliente(respuesta: RespuestaLoginCliente): Sesion {
  return sesionDesdeRespuesta(respuesta)
}

export function actualizarPerfilEnSesion(
  sesion: Sesion,
  perfil: PerfilCliente,
): Sesion {
  if (sesion.usuario.tipo !== 'cliente') return sesion

  return {
    ...sesion,
    usuario: {
      ...sesion.usuario,
      id: perfil.id,
      nombre: perfil.nombre,
      username: perfil.username,
      correo: perfil.correo,
      celular: perfil.celular,
    },
  }
}
