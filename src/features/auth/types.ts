/** Tipos tomados de docs/backend/AUTH.md y CUENTAS_CLIENTE.md. No inventar campos. */

import type { TipoSesion } from '@/shared/lib/rutas'

export type EstadoCuenta = 'activo' | 'suspendido' | 'vencido'
export type TipoToken = 'cliente' | 'barbero' | 'admin'
export type MetodoSesion = 'password' | 'google' | 'passkey'

export interface CredencialesLogin {
  username: string
  password: string
}

/** Login unificado de barbero/cliente (`POST /auth/login`). */
export interface CredencialesLoginUnificado {
  usuario: string
  contrasena: string
}

export interface BarberoAutenticado {
  id: number
  codigoUnico: string
  nombres: string
  apellidos: string
  nombreBarberia: string | null
  username: string
  estadoCuenta: EstadoCuenta
}

export interface ClienteAutenticado {
  id: number
  nombre: string
  username: string
  correo: string
  celular: string
}

export interface RespuestaLoginBarbero {
  accessToken: string
  tipo: 'barbero'
  barbero: BarberoAutenticado
}

export interface RespuestaLoginCliente {
  accessToken: string
  tipo: 'cliente'
  cliente: ClienteAutenticado
}

export type RespuestaLogin = RespuestaLoginBarbero | RespuestaLoginCliente

export interface RespuestaLoginAdmin {
  accessToken: string
  admin: {
    id: number
    username: string
    nombre: string
  }
}

/** Datos mínimos que viven en memoria durante el alta con Google. */
export interface PerfilGoogle {
  nombre: string
  correo: string
}

export interface RespuestaGoogleExistente {
  requiereCompletar: false
  accessToken: string
  tipo: 'cliente'
  cliente: ClienteAutenticado
}

export interface RespuestaGoogleNueva {
  requiereCompletar: true
  registroToken: string
  perfil: PerfilGoogle
}

export type RespuestaGoogle = RespuestaGoogleExistente | RespuestaGoogleNueva

/** Solo en memoria: nunca se guarda en storage, URL, caché ni history.state. */
export interface RegistroPendiente {
  registroToken: string
  perfil: PerfilGoogle
}

export interface DatosCompletarCuenta {
  registroToken: string
  username: string
  contrasena: string
  celular: string
  nombre?: string
}

export interface PerfilCliente {
  id: number
  nombre: string
  username: string
  correo: string
  celular: string
}

export interface ActualizarPerfilBody {
  nombre?: string
  celular?: string
}

export interface CambiarContrasenaBody {
  nuevaContrasena: string
  contrasenaActual?: string
}

export interface UsuarioSesionBarbero extends BarberoAutenticado {
  tipo: 'barbero'
}

export interface UsuarioSesionCliente extends ClienteAutenticado {
  tipo: 'cliente'
}

export type UsuarioSesion = UsuarioSesionBarbero | UsuarioSesionCliente

/** Ranura única: barbero o cliente, con el token y el usuario. */
export interface Sesion {
  token: string
  tipo: TipoSesion
  usuario: UsuarioSesion
}

/** Sesión del panel, guardada aparte en `klippflow.admin.sesion`. */
export interface SesionAdmin {
  accessToken: string
  id: number
  username: string
  nombre: string
}

export interface PayloadJwt {
  sub?: number
  tipo?: TipoToken
  username?: string
  /** Claim del backend: método con el que se emitió la sesión. */
  metodo?: MetodoSesion
  iat?: number
  exp?: number
}

export function nombreDeSesion(sesion: Sesion | null): string | null {
  if (!sesion) return null
  if (sesion.usuario.tipo === 'barbero') {
    const completo = `${sesion.usuario.nombres} ${sesion.usuario.apellidos}`.trim()
    return completo || sesion.usuario.username
  }
  return sesion.usuario.nombre || sesion.usuario.username
}
