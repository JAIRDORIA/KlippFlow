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

export type RespuestaCrearCitaCliente = CitaCreada
