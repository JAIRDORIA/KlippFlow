import { peticion } from '@/shared/api/client'
import type { CredencialesLogin, RespuestaLoginAdmin } from '@/features/auth/types'
import type {
  BarberoAdmin,
  CambiarEstadoBody,
  CodigoRotado,
  CrearBarberoBody,
  ListaBarberos,
  RespuestaOk,
} from './types'

/**
 * Endpoints del panel de administración.
 * Fuente: `docs/backend/ADMIN.md`. Todos usan el token de la zona `admin`.
 */

/** No redirige en 401: la pantalla de login muestra el error. */
export function loginAdmin(cuerpo: CredencialesLogin): Promise<RespuestaLoginAdmin> {
  return peticion<RespuestaLoginAdmin>('/auth/login/admin', {
    metodo: 'POST',
    cuerpo,
    zona: 'publico',
    redirigirEn401: false,
  })
}

export function listarBarberos(params: {
  pagina: number
  limite: number
}): Promise<ListaBarberos> {
  const consulta = new URLSearchParams({
    pagina: String(params.pagina),
    limite: String(params.limite),
  })

  return peticion<ListaBarberos>(`/admin/barberos?${consulta.toString()}`, {
    zona: 'admin',
  })
}

export function obtenerBarbero(id: number): Promise<BarberoAdmin> {
  return peticion<BarberoAdmin>(`/admin/barberos/${id}`, { zona: 'admin' })
}

export function crearBarbero(cuerpo: CrearBarberoBody): Promise<BarberoAdmin> {
  return peticion<BarberoAdmin>('/admin/barberos', {
    metodo: 'POST',
    cuerpo,
    zona: 'admin',
  })
}

/**
 * `PATCH /admin/barberos/:id/estado`. `ADMIN.md` no documenta el cuerpo de la
 * respuesta (200, "sin cambios" si ya tenía ese estado), así que no se usa:
 * la UI aplica el estado elegido y la lista se invalida.
 */
export function cambiarEstadoBarbero(
  id: number,
  cuerpo: CambiarEstadoBody,
): Promise<unknown> {
  return peticion<unknown>(`/admin/barberos/${id}/estado`, {
    metodo: 'PATCH',
    cuerpo,
    zona: 'admin',
  })
}

export function rotarCodigoBarbero(id: number): Promise<CodigoRotado> {
  return peticion<CodigoRotado>(`/admin/barberos/${id}/rotar-codigo`, {
    metodo: 'POST',
    zona: 'admin',
  })
}

export function restablecerPasswordBarbero(
  id: number,
  password: string,
): Promise<RespuestaOk> {
  return peticion<RespuestaOk>(`/admin/barberos/${id}/restablecer-password`, {
    metodo: 'POST',
    cuerpo: { password },
    zona: 'admin',
  })
}
