/** Tipos tomados de docs/backend/AUTH.md. No inventar campos. */

export type EstadoCuenta = 'activo' | 'suspendido' | 'vencido'
export type TipoToken = 'cliente' | 'barbero' | 'admin'

export interface CredencialesLogin {
  username: string
  password: string
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

export interface RespuestaLoginBarbero {
  accessToken: string
  barbero: BarberoAutenticado
}

export interface RespuestaLoginAdmin {
  accessToken: string
  admin: {
    id: number
    username: string
    nombre: string
  }
}

export interface SesionBarbero {
  accessToken: string
  nombre: string
  username: string
  nombreBarberia: string | null
}

export interface PayloadJwt {
  sub?: number
  tipo?: TipoToken
  username?: string
  exp?: number
}
