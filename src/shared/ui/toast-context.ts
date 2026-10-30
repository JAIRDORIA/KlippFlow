import { createContext, useContext } from 'react'

export interface AccionToast {
  etiqueta: string
  onClick: () => void
}

export interface OpcionesToast {
  mensaje: string
  accion?: AccionToast
  duracionMs?: number
}

export interface ToastContextValue {
  mostrarToast: (opciones: OpcionesToast) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const contexto = useContext(ToastContext)
  if (!contexto) {
    throw new Error('useToast debe usarse dentro de ToastProvider')
  }
  return contexto
}
