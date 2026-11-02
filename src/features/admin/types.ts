import type { EstadoCuenta } from '@/features/auth/types'

/**
 * Tipos del panel de administración.
 *
 * Fuente única: `docs/backend/ADMIN.md` y `docs/backend/AUTH.md`.
 * Nunca llega `password_hash` ni ningún campo extra.
 */

export type { EstadoCuenta }

/** Barbero tal como lo devuelve `GET /admin/barberos`. */
export interface BarberoAdmin {
  id: number
  codigoUnico: string
  nombres: string
  apellidos: string
  nombreBarberia: string | null
  username: string
  correo: string
  estadoCuenta: EstadoCuenta
  linkReservas: string
}

export interface ListaBarberos {
  total: number
  pagina: number
  limite: number
  barberos: BarberoAdmin[]
}

export interface CrearBarberoBody {
  username: string
  password: string
  nombres: string
  apellidos: string
  nombreBarberia?: string
  correo: string
}

export interface CambiarEstadoBody {
  estado: EstadoCuenta
}

export interface CodigoRotado {
  codigoUnico: string
  linkReservas: string
}

export interface RespuestaOk {
  ok: boolean
}
