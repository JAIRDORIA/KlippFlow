/**
 * Tipos del panel del barbero.
 *
 * Fuente única: `docs/backend/BARBERO_SOLICITUDES_Y_DASHBOARD.md` y
 * `docs/backend/ATENCIONES_Y_PROPINAS.md`. No se inventan campos: los que solo
 * existen en un contexto (solicitudes, dashboard o atención) quedan opcionales.
 */

export type MontoApi = number | string

export type EstadoCita =
  | 'pendiente'
  | 'aceptada'
  | 'rechazada'
  | 'cancelada'
  | 'expirada'
  | 'atendida'
  | 'no_asistio'

export type MotivoRechazo = 'horario_ocupado' | 'no_disponible'

export interface ClienteCita {
  nombre: string
  celular: string
  correo: string | null
}

export interface ServicioCita {
  nombre: string
  precio: MontoApi
  duracionMinutos: number
}

export interface PersonaCita {
  esTitular: boolean
  /**
   * Titular: nombre del cliente. Acompañante: `nombreAcompanante`, que es
   * opcional al crear la cita (`PUBLICO_CREAR_CITA.md`).
   */
  nombre: string | null
  duracionTotalMinutos: number
  servicios: ServicioCita[]
}

export interface AtencionCita {
  montoCobrado: MontoApi
  saldoCobrado: MontoApi
  montoPropina: MontoApi | null
}

/**
 * DTO de cita del panel. El documento lo describe completo en la sección de
 * solicitudes y dice que el dashboard añade `puedeMarcarNoAsistio` y `atencion`.
 */
export interface CitaBarbero {
  id: number
  estado: EstadoCita
  fecha: string
  horaInicio: string
  horaFin: string
  cliente: ClienteCita | null
  numPersonas: number
  montoTotal: MontoApi
  personas: PersonaCita[]
  minutosFueraHorario: number
  avisoDescanso: string | null
  creadaEn: string
  /** Solo en solicitudes pendientes vigentes. */
  expiraEn?: string | null
  /** Solo en solicitudes pendientes vigentes. */
  minutosRestantes?: number | null
  motivoRechazo?: MotivoRechazo | null
  motivoCancelacion?: string | null
  /** Solo en el dashboard: true si está aceptada y ya pasó su hora. */
  puedeMarcarNoAsistio?: boolean
  /** Solo en el dashboard; `null` si la cita aún no está atendida. */
  atencion?: AtencionCita | null
}

/** `GET /barbero/solicitudes` devuelve el mismo DTO de cita. */
export type Solicitud = CitaBarbero

export interface ResumenDia {
  citasHoy: number
  aceptadas: number
  atendidas: number
  noAsistio: number
  solicitudesPendientes: number
}

export interface BloqueTrabajo {
  horaInicio: string
  horaFin: string
}

export interface HuecoLibre {
  horaInicio: string
  horaFin: string
}

export interface DashboardHoy {
  fecha: string
  resumen: ResumenDia
  bloquesDeTrabajo: BloqueTrabajo[]
  citas: CitaBarbero[]
  huecosLibres: HuecoLibre[]
}

/**
 * Aceptar, rechazar, cancelar y no-asistió responden 200 con la cita
 * actualizada y, cuando aplica, `whatsappUrl`.
 */
export interface RespuestaAccionCita extends CitaBarbero {
  whatsappUrl?: string
}

export interface AtencionRegistrada {
  citaId: number
  montoCobrado: MontoApi
  anticipoAplicado: MontoApi
  saldoCobrado: MontoApi
  montoPropina: MontoApi | null
  totalRecibido: MontoApi
}

/** `POST /barbero/citas/:id/atendido`. */
export interface RespuestaAtencion {
  citaId: number
  estado: EstadoCita
  atencion: AtencionRegistrada
}

/** `PUT /barbero/citas/:id/propina`. */
export interface RespuestaPropina {
  citaId: number
  atencion: AtencionRegistrada
}
