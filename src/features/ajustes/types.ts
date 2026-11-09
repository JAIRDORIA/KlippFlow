/**
 * Tipos de Ajustes.
 *
 * Fuentes únicas:
 * - `docs/backend/SERVICIOS.md`
 * - `docs/backend/HORARIOS_Y_CONFIGURACION.md`
 * - `docs/backend/WHATSAPP_BASE.md`
 *
 * No se inventan campos. `barberoId` nunca se envía: sale del JWT.
 */

export type MontoApi = number | string

/** `GET /barbero/configuracion` */
export interface Configuracion {
  codigoUnico: string
  /** Ya viene completo (`APP_PUBLIC_URL/b/{codigoUnico}`). */
  linkReservas: string
  /** Consentimiento del barbero (`docs/backend/WHATSAPP_BASE.md` §6.1). */
  whatsapp: ConfiguracionWhatsapp
}

export interface ConfiguracionWhatsapp {
  /** Celular normalizado a 10 dígitos o `null` si nunca se guardó. */
  celular: string | null
  activo: boolean
}

/**
 * Body de `PUT /barbero/configuracion/whatsapp`.
 *
 * `celular` es opcional en el backend: omitirlo con `activo: false` apaga el
 * flag y conserva el número guardado. Enviarlo inválido responde 400.
 */
export interface ActualizarWhatsappBody {
  celular?: string
  activo: boolean
}

export interface RespuestaWhatsapp {
  whatsapp: ConfiguracionWhatsapp
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
