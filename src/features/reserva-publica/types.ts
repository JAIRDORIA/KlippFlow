/**
 * Tipos del contrato público, tomados de:
 * - docs/backend/PUBLICO_INFO_Y_DISPONIBILIDAD.md
 * - docs/backend/PUBLICO_CREAR_CITA.md
 *
 * Los montos pueden llegar como número o texto; se convierten siempre con
 * Number antes de formatearlos.
 */

export type MontoApi = number | string

export interface ServicioPublico {
  id: number
  nombre: string
  descripcion: string | null
  precio: MontoApi
  duracionMinutos: number
}

export interface BarberoPublico {
  nombres: string
  nombreBarberia: string | null
  reservasDisponibles: boolean
  servicios: ServicioPublico[]
}

export type EstadoSlot = 'verde' | 'naranja' | 'rojo'

export interface SlotDisponibilidad {
  horaInicio: string
  horaFin: string
  estado: EstadoSlot
  minutosFueraDeHorario: number
}

export interface DisponibilidadPublica {
  fecha: string
  duracionMinutos: number
  cuadriculaMinutos: number
  slots: SlotDisponibilidad[]
}

export interface PersonaCrearCita {
  servicioIds: number[]
  /** El nombre del acompañante es opcional en el contrato; el titular va en `nombre`. */
  nombre?: string
}

export interface CrearCitaBody {
  nombre: string
  celular: string
  correo?: string
  fecha: string
  horaInicio: string
  personas: PersonaCrearCita[]
}

export type EstadoCita =
  | 'pendiente'
  | 'aceptada'
  | 'rechazada'
  | 'cancelada'
  | 'expirada'
  | 'atendida'
  | 'no_asistio'

export type MotivoRechazo = 'horario_ocupado' | 'no_disponible'

export interface CitaCreada {
  token: string
  seguimientoUrl: string
  estado: EstadoCita
  fecha: string
  horaInicio: string
  horaFin: string
  numPersonas: number
  montoTotal: MontoApi
  mensaje: string
}

export interface SeguimientoCita {
  estado: EstadoCita
  mensaje: string
  fecha: string
  horaInicio: string
  horaFin: string
  barbero: {
    nombres: string
    nombreBarberia: string | null
  }
  numPersonas: number
  montoTotal: MontoApi
  motivoRechazo?: MotivoRechazo | null
  motivoCancelacion?: string | null
}

export interface CitaGuardada {
  token: string
  codigo: string
  creadoEn: string
}
