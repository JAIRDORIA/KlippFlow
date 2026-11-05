import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { rutaInicialPorRol } from '@/shared/lib/rutas'

export function RootRedirect() {
  const { tipo } = useAuth()
  return <Navigate to={rutaInicialPorRol(tipo)} replace />
}
