import { createContext } from 'react'
import type { TipoSesion } from '@/shared/lib/rutas'
import type {
  MetodoSesion,
  PerfilCliente,
  RegistroPendiente,
  RespuestaLogin,
  Sesion,
  UsuarioSesion,
} from './types'

export interface AuthContextValue {
  sesion: Sesion | null
  estaAutenticado: boolean
  tipo: TipoSesion | null
  usuario: UsuarioSesion | null
  nombre: string | null
  /** Claim `metodo` del JWT; solo UI. */
  metodo: MetodoSesion | null
  /** Solo en memoria: se pierde al recargar la página. */
  registroPendiente: RegistroPendiente | null
  iniciarSesion: (respuesta: RespuestaLogin) => Sesion
  guardarRegistroPendiente: (registro: RegistroPendiente) => void
  limpiarRegistroPendiente: () => void
  actualizarPerfil: (perfil: PerfilCliente) => void
  cerrarSesion: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
