import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'

export function RootRedirect() {
  const { estaAutenticado } = useAuth()
  return <Navigate to={estaAutenticado ? '/app/hoy' : '/login'} replace />
}
