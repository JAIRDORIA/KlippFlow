import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { volverSeguro } from '@/shared/lib/rutas'
import { useAuth } from './useAuth'

export interface ProtectedRouteProps {
  children?: ReactNode
}

/** Protege /app/* con la sesión de barbero. */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { sesion } = useAuth()
  const ubicacion = useLocation()

  if (!sesion) {
    const volver = volverSeguro(`${ubicacion.pathname}${ubicacion.search}`)
    return (
      <Navigate
        to={volver ? `/login?volver=${encodeURIComponent(volver)}` : '/login'}
        replace
      />
    )
  }

  if (sesion.tipo === 'cliente') {
    return <Navigate to="/mi" replace />
  }

  return children ?? <Outlet />
}

/** Protege /mi y /mi/* con la sesión de cliente. */
export function RutaCliente({ children }: ProtectedRouteProps) {
  const { sesion } = useAuth()
  const ubicacion = useLocation()

  if (!sesion) {
    const volver =
      volverSeguro(`${ubicacion.pathname}${ubicacion.search}`) ?? '/mi'
    return (
      <Navigate
        to={`/login?volver=${encodeURIComponent(volver)}`}
        replace
      />
    )
  }

  if (sesion.tipo === 'barbero') {
    return <Navigate to="/app" replace />
  }

  return children ?? <Outlet />
}
