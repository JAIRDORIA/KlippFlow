import { useContext } from 'react'
import { AdminAuthContext, type AdminAuthContextValue } from './admin-auth-context'

export function useAdminAuth(): AdminAuthContextValue {
  const contexto = useContext(AdminAuthContext)
  if (!contexto) {
    throw new Error('useAdminAuth debe usarse dentro de AdminAuthProvider')
  }
  return contexto
}
