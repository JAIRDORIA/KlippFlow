import { X } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ToastContext, type OpcionesToast } from './toast-context'

interface ToastActivo extends OpcionesToast {
  id: number
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastActivo | null>(null)

  const mostrarToast = useCallback((opciones: OpcionesToast) => {
    setToast({ ...opciones, id: Date.now() })
  }, [])

  const cerrar = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (!toast) return
    const duracion = toast.duracionMs ?? 4000
    const temporizador = window.setTimeout(() => setToast(null), duracion)
    return () => window.clearTimeout(temporizador)
  }, [toast])

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-[calc(var(--height-nav)+env(safe-area-inset-bottom)+var(--space-gap-lg))] left-1/2 z-[var(--z-toast)] w-[calc(100%-2rem)] max-w-[26rem] -translate-x-1/2 min-[900px]:bottom-[calc(var(--height-nav)+var(--space-gap-lg)+var(--space-screen-bottom))]"
      >
        {toast && (
          <div
            key={toast.id}
            role="status"
            className="kf-toast pointer-events-auto flex items-center gap-3 rounded-[var(--radius-toast)] border border-line bg-elevated px-[var(--space-toast-left)] py-[var(--space-toast-vertical)] shadow-[var(--shadow-toast)]"
          >
            <p className="type-small flex-1 text-text">{toast.mensaje}</p>
            {toast.accion &&
              (toast.accion.href ? (
                <a
                  href={toast.accion.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={cerrar}
                  className="type-small inline-flex h-[var(--height-button-toast)] shrink-0 items-center justify-center rounded-[var(--radius-button-toast)] bg-accent px-3 font-medium text-ink"
                >
                  {toast.accion.etiqueta}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    toast.accion?.onClick?.()
                    cerrar()
                  }}
                  className="type-small h-[var(--height-button-toast)] shrink-0 rounded-[var(--radius-button-toast)] bg-accent px-3 font-medium text-ink"
                >
                  {toast.accion.etiqueta}
                </button>
              ))}
            <button
              type="button"
              aria-label="Cerrar aviso"
              onClick={cerrar}
              className="inline-flex size-[var(--height-button-toast)] shrink-0 items-center justify-center rounded-[var(--radius-button-toast)] text-secondary hover:bg-white-5 hover:text-text"
            >
              <X aria-hidden="true" size={16} strokeWidth={1.6} />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
