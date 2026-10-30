import { X } from 'lucide-react'
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

export interface SheetProps {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  descripcion?: string
  children: ReactNode
  pie?: ReactNode
  className?: string
}

const SELECTOR_ENFOCABLES = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function Sheet({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  children,
  pie,
  className,
}: SheetProps) {
  const idTitulo = useId()
  const idDescripcion = useId()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return

    const elementoPrevio =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflowPrevio = document.body.style.overflow
    const paddingPrevio = document.body.style.paddingRight
    const anchoBarra = window.innerWidth - document.documentElement.clientWidth

    document.body.classList.add('scroll-lock')
    document.body.style.overflow = 'hidden'
    if (anchoBarra > 0) {
      document.body.style.paddingRight = `${anchoBarra}px`
    }

    const focoInicial = window.setTimeout(() => {
      panel.current?.focus()
    }, 0)

    function alTeclear(evento: globalThis.KeyboardEvent) {
      if (evento.key === 'Escape') {
        evento.preventDefault()
        onCerrar()
      }
    }

    document.addEventListener('keydown', alTeclear)

    return () => {
      window.clearTimeout(focoInicial)
      document.removeEventListener('keydown', alTeclear)
      document.body.classList.remove('scroll-lock')
      document.body.style.overflow = overflowPrevio
      document.body.style.paddingRight = paddingPrevio
      elementoPrevio?.focus()
    }
  }, [abierto, onCerrar])

  function atraparFoco(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key !== 'Tab') return

    const enfocables = Array.from(
      panel.current?.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES) ?? [],
    )

    if (enfocables.length === 0) {
      evento.preventDefault()
      panel.current?.focus()
      return
    }

    const primero = enfocables[0]
    const ultimo = enfocables[enfocables.length - 1]
    if (!primero || !ultimo) return

    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault()
      ultimo.focus()
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault()
      primero.focus()
    }
  }

  if (!abierto) return null

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-sheet)]">
      <div
        data-testid="sheet-overlay"
        aria-hidden="true"
        data-state="abierto"
        onClick={onCerrar}
        className="kf-overlay absolute inset-0 bg-overlay"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={descripcion ? idDescripcion : undefined}
        tabIndex={-1}
        data-state="abierto"
        onKeyDown={atraparFoco}
        className={cn(
          'kf-panel fixed bottom-0 left-1/2 flex w-full max-w-[var(--width-shell)] -translate-x-1/2 flex-col min-[900px]:bottom-6',
          'max-h-[var(--max-height-sheet)] overflow-y-auto rounded-t-[var(--radius-sheet)] border-t border-line bg-elevated min-[900px]:rounded-[var(--radius-sheet)] min-[900px]:border',
          'px-[var(--space-sheet-x)] pb-[calc(var(--space-sheet-bottom)+env(safe-area-inset-bottom))] pt-[var(--space-sheet-top)]',
          'focus:outline-none focus-visible:outline-none',
          className,
        )}
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-4 h-[var(--height-sheet-handle)] w-[var(--width-sheet-handle)] rounded-[var(--radius-pill)] bg-white-15"
        />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex-1">
            <h2 id={idTitulo} className="type-card-title">
              {titulo}
            </h2>
            {descripcion && (
              <p id={idDescripcion} className="type-small mt-2 text-secondary">
                {descripcion}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onCerrar}
            className="inline-flex size-[var(--height-icon-button)] shrink-0 items-center justify-center rounded-[var(--radius-button-card)] text-secondary hover:bg-white-5 hover:text-text"
          >
            <X aria-hidden="true" size={18} strokeWidth={1.6} />
          </button>
        </div>
        <div className="flex-1">{children}</div>
        {pie && <div className="mt-6">{pie}</div>}
      </div>
    </div>,
    document.body,
  )
}
