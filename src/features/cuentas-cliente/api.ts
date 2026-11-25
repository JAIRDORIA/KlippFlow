import type {
  ActualizarPerfilBody,
  CambiarContrasenaBody,
  CredencialesLoginUnificado,
  DatosCompletarCuenta,
  DatosRegistroCliente,
  PerfilCliente,
  RespuestaGoogle,
  RespuestaLogin,
  RespuestaLoginCliente,
  RespuestaMensajeOk,
  RespuestaRegistroCliente,
  DatosRestablecerPassword,
  DatosVerificarCorreo,
} from '@/features/auth/types'
import { peticion } from '@/shared/api/client'
import type {
  BarberoCliente,
  CitaCliente,
  CitaClienteDetalle,
  CrearCitaClienteBody,
  RespuestaCrearCitaCliente,
  VincularBarberoResponse,
} from './types'

export function loginUnificado(
  credenciales: CredencialesLoginUnificado,
): Promise<RespuestaLogin> {
  return peticion<RespuestaLogin>('/auth/login', {
    metodo: 'POST',
    cuerpo: credenciales,
    zona: 'publico',
    redirigirEn401: false,
  })
}

export function loginGoogle(idToken: string): Promise<RespuestaGoogle> {
  return peticion<RespuestaGoogle>('/auth/cliente/google', {
    metodo: 'POST',
    cuerpo: { idToken },
    zona: 'publico',
    redirigirEn401: false,
  })
}

/**
 * Alta pública de cliente con usuario y contraseña. Ya no devuelve sesión:
 * responde 201 con `requiereVerificacion` y envía un código al correo.
 */
export function registrarCliente(
  datos: DatosRegistroCliente,
): Promise<RespuestaRegistroCliente> {
  return peticion<RespuestaRegistroCliente>('/auth/cliente/registro', {
    metodo: 'POST',
    cuerpo: datos,
    zona: 'publico',
    redirigirEn401: false,
  })
}

/** Confirma el correo con el código de 6 dígitos. Aquí sí se inicia sesión. */
export function verificarCorreo(
  datos: DatosVerificarCorreo,
): Promise<RespuestaLoginCliente> {
  return peticion<RespuestaLoginCliente>('/auth/cliente/verificar-correo', {
    metodo: 'POST',
    cuerpo: datos,
    zona: 'publico',
    redirigirEn401: false,
  })
}

/** Respuesta genérica a propósito: no revela si la cuenta existe. */
export function reenviarCodigoVerificacion(
  correo: string,
): Promise<RespuestaMensajeOk> {
  return peticion<RespuestaMensajeOk>(
    '/auth/cliente/reenviar-codigo-verificacion',
    {
      metodo: 'POST',
      cuerpo: { correo },
      zona: 'publico',
      redirigirEn401: false,
    },
  )
}

/** `identificador` es el username o el correo. Respuesta siempre genérica. */
export function solicitarRecuperacionPassword(
  identificador: string,
): Promise<RespuestaMensajeOk> {
  return peticion<RespuestaMensajeOk>('/auth/cliente/recuperar-password', {
    metodo: 'POST',
    cuerpo: { identificador },
    zona: 'publico',
    redirigirEn401: false,
  })
}

export function restablecerPassword(
  datos: DatosRestablecerPassword,
): Promise<{ ok: true }> {
  return peticion<{ ok: true }>('/auth/cliente/restablecer-password', {
    metodo: 'POST',
    cuerpo: datos,
    zona: 'publico',
    redirigirEn401: false,
  })
}

export function completarCuenta(
  datos: DatosCompletarCuenta,
): Promise<RespuestaLoginCliente> {
  return peticion<RespuestaLoginCliente>('/auth/cliente/completar-cuenta', {
    metodo: 'POST',
    cuerpo: datos,
    zona: 'publico',
    redirigirEn401: false,
  })
}

export function obtenerPerfil(): Promise<PerfilCliente> {
  return peticion<PerfilCliente>('/cliente/perfil', { zona: 'cliente' })
}

export function actualizarPerfil(
  datos: ActualizarPerfilBody,
): Promise<PerfilCliente> {
  return peticion<PerfilCliente>('/cliente/perfil', {
    metodo: 'PATCH',
    cuerpo: datos,
    zona: 'cliente',
  })
}

export function cambiarContrasena(
  datos: CambiarContrasenaBody,
): Promise<{ ok: boolean }> {
  return peticion<{ ok: boolean }>('/cliente/contrasena', {
    metodo: 'PUT',
    cuerpo: datos,
    zona: 'cliente',
  })
}

export function obtenerBarberosCliente(): Promise<BarberoCliente[]> {
  return peticion<BarberoCliente[]>('/cliente/barberos', { zona: 'cliente' })
}

export function vincularBarbero(codigo: string): Promise<VincularBarberoResponse> {
  return peticion<VincularBarberoResponse>('/cliente/barberos', {
    metodo: 'POST',
    cuerpo: { codigo },
    zona: 'cliente',
  })
}

export function crearCitaCliente(
  codigo: string,
  cuerpo: CrearCitaClienteBody,
): Promise<RespuestaCrearCitaCliente> {
  return peticion<RespuestaCrearCitaCliente>(
    `/cliente/barberos/${encodeURIComponent(codigo)}/citas`,
    {
      metodo: 'POST',
      cuerpo,
      zona: 'cliente',
    },
  )
}

export function obtenerCitasCliente(): Promise<CitaCliente[]> {
  return peticion<CitaCliente[]>('/cliente/citas', { zona: 'cliente' })
}

export function obtenerCitaCliente(id: number): Promise<CitaClienteDetalle> {
  return peticion<CitaClienteDetalle>(
    `/cliente/citas/${encodeURIComponent(String(id))}`,
    { zona: 'cliente' },
  )
}

function rutaCambioHora(id: number, accion: 'aceptar' | 'rechazar'): string {
  return `/cliente/citas/${encodeURIComponent(String(id))}/cambio-hora/${accion}`
}

/**
 * Aplica la nueva hora propuesta. Si la cita venía `pendiente` queda
 * `aceptada`; si ya estaba `aceptada`, conserva el estado y cambia la hora.
 */
export function aceptarCambioHora(id: number): Promise<CitaClienteDetalle> {
  return peticion<CitaClienteDetalle>(rutaCambioHora(id, 'aceptar'), {
    metodo: 'POST',
    zona: 'cliente',
  })
}

/**
 * Descarta la propuesta. `pendiente` → `rechazada` (motivo
 * `cambio_hora_rechazado`); `aceptada` → sigue en su hora original.
 */
export function rechazarCambioHora(id: number): Promise<CitaClienteDetalle> {
  return peticion<CitaClienteDetalle>(rutaCambioHora(id, 'rechazar'), {
    metodo: 'POST',
    zona: 'cliente',
  })
}
