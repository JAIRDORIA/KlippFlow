import { createContext, useContext } from 'react'

export interface AccionToast {
  etiqueta: string
  /** Acción con manejador: se ejecuta y cierra el toast. */
  onClick?: () => void
  /**
   * Acción con enlace real. Se renderiza como `<a target="_blank">` para que
   * abrir WhatsApp no dependa de `window.open` después de una promesa.
   */
  href?: string
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
