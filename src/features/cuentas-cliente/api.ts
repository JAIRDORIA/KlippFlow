import type {
  ActualizarPerfilBody,
  CambiarContrasenaBody,
  CredencialesLoginUnificado,
  DatosCompletarCuenta,
  PerfilCliente,
  RespuestaGoogle,
  RespuestaLogin,
  RespuestaLoginCliente,
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
