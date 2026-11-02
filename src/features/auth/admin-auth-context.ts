import { createContext } from 'react'
import type { CredencialesLogin, SesionAdmin } from './types'

export interface AdminAuthContextValue {
  sesion: SesionAdmin | null
  estaAutenticado: boolean
  login: (credenciales: CredencialesLogin) => Promise<SesionAdmin>
  cerrarSesion: () => void
}

/** Contexto propio del admin: nunca se mezcla con el del barbero. */
export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)
