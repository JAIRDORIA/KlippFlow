import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export interface ProtectedRouteProps {
  children?: ReactNode
}

/** Protege /app/* con la sesión de barbero. */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { estaAutenticado } = useAuth()
  const ubicacion = useLocation()

  if (!estaAutenticado) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }

  return children ?? <Outlet />
}
