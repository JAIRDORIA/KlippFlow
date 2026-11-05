import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser'
import type { RespuestaLoginCliente } from '@/features/auth/types'

/** Respuesta cruda del backend; no se transforma. */
export interface OpcionesPasskey<T> {
  opciones: T
  desafioToken: string
}

export type OpcionesRegistroPasskey =
  OpcionesPasskey<PublicKeyCredentialCreationOptionsJSON>

export type OpcionesLoginPasskey =
  OpcionesPasskey<PublicKeyCredentialRequestOptionsJSON>

export interface PasskeyCliente {
  id: number
  nombre: string
  tipoDispositivo: string
  respaldada: boolean
  creadaEn: string
  ultimoUsoEn: string | null
}

export interface RegistroPasskeyResponse {
  id: number
  nombre: string
}

export interface VerificarRegistroPasskeyBody {
  desafioToken: string
  respuesta: RegistrationResponseJSON
  nombre?: string
}

export interface VerificarLoginPasskeyBody {
  desafioToken: string
  respuesta: AuthenticationResponseJSON
}

export type RespuestaLoginPasskey = RespuestaLoginCliente
