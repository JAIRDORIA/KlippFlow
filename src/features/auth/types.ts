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
  /** Null cuando la cuenta se creó sin correo (es opcional). */
  correo: string | null
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

/** Alta de cliente con usuario y contraseña (`POST /auth/cliente/registro`). */
export interface DatosRegistroCliente {
  nombre: string
  username: string
  contrasena: string
  celular: string
  /** Obligatorio: es el correo que se verifica con un código de 6 dígitos. */
  correo: string
}

/** El registro ya no inicia sesión: hay que verificar el correo primero. */
export interface RespuestaRegistroCliente {
  requiereVerificacion: true
  correo: string
  mensaje: string
}

/** `POST /auth/cliente/verificar-correo`. El código va como string (ceros a la izquierda). */
export interface DatosVerificarCorreo {
  correo: string
  codigo: string
}

/** Respuesta genérica de reenviar código y recuperar contraseña. */
export interface RespuestaMensajeOk {
  ok: true
  mensaje: string
}

/** `POST /auth/cliente/restablecer-password`. */
export interface DatosRestablecerPassword {
  /** Username o correo, el mismo que se usó al pedir el código. */
  identificador: string
  codigo: string
  nuevaContrasena: string
}

export interface PerfilCliente {
  id: number
  nombre: string
  username: string
  correo: string | null
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
