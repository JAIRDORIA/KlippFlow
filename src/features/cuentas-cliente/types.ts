/**
 * Tipos de docs/backend/CUENTAS_CLIENTE.md. No inventar campos.
 */

import type {
  CitaCreada,
  EstadoCita,
  MontoApi,
} from '@/features/reserva-publica/types'

export interface BarberoCliente {
  nombre: string
  nombreBarberia: string | null
  codigo: string
  reservasDisponibles: boolean
}

export interface PersonaCitaCliente {
  servicioIds: number[]
  nombre?: string
}

export interface CrearCitaClienteBody {
  fecha: string
  horaInicio: string
  personas: PersonaCitaCliente[]
  /** Consentimiento explícito para recordatorios por WhatsApp (por defecto false). */
  aceptaWhatsapp?: boolean
}

export interface MotivosCitaCliente {
  motivoRechazo: string | null
  motivoCancelacion: string | null
}

export interface CitaCliente {
  id: number
  estado: EstadoCita
  fecha: string
  horaInicio: string
  horaFin: string
  barbero: {
    nombre: string
    nombreBarberia: string | null
    codigo: string
  }
  numPersonas: number
  montoTotal: MontoApi
  motivos: MotivosCitaCliente
}

export interface ServicioDetalleCliente {
  nombre: string
  precio: MontoApi
  duracionMinutos: number
}

export interface PersonaDetalleCliente {
  esTitular: boolean
  nombreAcompanante: string | null
  duracionTotalMinutos: number
  servicios: ServicioDetalleCliente[]
}

/** `GET /cliente/citas/:id`: listado + personas y servicios. */
export interface CitaClienteDetalle extends CitaCliente {
  personas: PersonaDetalleCliente[]
}

export interface VincularBarberoResponse {
  creado: boolean
  barbero: BarberoCliente
}

export type RespuestaCrearCitaCliente = CitaCreada
