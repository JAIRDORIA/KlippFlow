/**
 * Tipos de Ajustes.
 *
 * Fuentes únicas:
 * - `docs/backend/SERVICIOS.md`
 * - `docs/backend/HORARIOS_Y_CONFIGURACION.md`
 *
 * No se inventan campos. `barberoId` nunca se envía: sale del JWT.
 */

export type MontoApi = number | string

/** `GET /barbero/configuracion` */
export interface Configuracion {
  codigoUnico: string
  /** Ya viene completo (`APP_PUBLIC_URL/b/{codigoUnico}`). */
  linkReservas: string
}

/** Servicio tal como lo devuelve la API. */
export interface Servicio {
  id: number
  nombre: string
  descripcion: string | null
  precio: MontoApi
  duracionMinutos: number
  activo: boolean
}

export interface CrearServicioBody {
  nombre: string
  /** Opcional; si se omite no se envía. */
  descripcion?: string
  precio: number
  duracionMinutos: number
}

/** PATCH acepta solo los campos enviados, incluido `activo`. */
export interface EditarServicioBody {
  nombre?: string
  descripcion?: string
  precio?: number
  duracionMinutos?: number
  activo?: boolean
}

/**
 * Bloque de horario. `horaInicio`/`horaFin` llegan como `HH:mm` o `HH:mm:ss`
 * según la columna TIME de MySQL; la UI los normaliza a `HH:mm`.
 */
export interface Horario {
  id: number
  /** 0 = domingo, 1 = lunes, … 6 = sábado. */
  diaSemana: number
  horaInicio: string
  horaFin: string
  activo: boolean
}

export interface CrearHorarioBody {
  diaSemana: number
  horaInicio: string
  horaFin: string
  /** Opcional; por defecto true en el backend. */
  activo?: boolean
}

export interface EditarHorarioBody {
  diaSemana?: number
  horaInicio?: string
  horaFin?: string
  activo?: boolean
}
