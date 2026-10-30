import { createContext } from 'react'
import type { CredencialesLogin, SesionBarbero } from './types'

export interface AuthContextValue {
  sesion: SesionBarbero | null
  estaAutenticado: boolean
  nombre: string | null
  login: (credenciales: CredencialesLogin) => Promise<SesionBarbero>
  cerrarSesion: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
