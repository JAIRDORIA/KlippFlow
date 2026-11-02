import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminAuth } from './useAdminAuth'

/** Solo deja entrar con sesión de administrador válida. */
export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { estaAutenticado } = useAdminAuth()

  if (!estaAutenticado) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
