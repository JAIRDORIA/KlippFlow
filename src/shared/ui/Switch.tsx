import { cn } from '@/shared/lib/cn'

export interface SwitchProps {
  activo: boolean
  onCambio: (activo: boolean) => void
  etiqueta: string
  disabled?: boolean
  className?: string
}

export function Switch({
  activo,
  onCambio,
  etiqueta,
  disabled = false,
  className,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={disabled}
      onClick={() => onCambio(!activo)}
      className={cn(
        'relative inline-flex h-[var(--height-button-compact)] w-[var(--width-switch)] shrink-0 items-center justify-center disabled:opacity-35',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'relative block h-[var(--height-switch)] w-[var(--width-switch)] rounded-[var(--radius-pill)] transition-colors',
          activo ? 'bg-accent' : 'bg-white-10',
        )}
      >
        <span
          className={cn(
            'absolute left-1 top-1 size-[var(--size-switch-knob)] rounded-[var(--radius-pill)] transition-transform',
            activo ? 'translate-x-5 bg-ink' : 'translate-x-0 bg-text',
          )}
        />
      </span>
    </button>
  )
}
