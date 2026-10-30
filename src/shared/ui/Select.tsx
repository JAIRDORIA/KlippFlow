import { ChevronDown } from 'lucide-react'
import { useId, type SelectHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'
import { Field } from './Field'

export interface OpcionSelect {
  valor: string
  etiqueta: string
  deshabilitada?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  etiqueta: string
  opciones: readonly OpcionSelect[]
  ayuda?: string
  error?: string
  id?: string
  placeholder?: string
}

export function Select({
  etiqueta,
  opciones,
  ayuda,
  error,
  id,
  placeholder,
  className,
  ...props
}: SelectProps) {
  const idGenerado = useId()
  const idCampo = id ?? idGenerado
  const idAyuda = `${idCampo}-ayuda`
  const idError = `${idCampo}-error`
  const descritoPor = [ayuda ? idAyuda : null, error ? idError : null]
    .filter(Boolean)
    .join(' ')

  return (
    <Field
      etiqueta={etiqueta}
      htmlFor={idCampo}
      ayuda={ayuda}
      error={error}
      idAyuda={idAyuda}
      idError={idError}
    >
      <div className="relative">
        <select
          {...props}
          id={idCampo}
          aria-invalid={error ? true : undefined}
          aria-describedby={descritoPor || undefined}
          className={cn(
            'type-form h-[var(--height-input)] w-full appearance-none rounded-[var(--radius-input)] border border-line bg-card px-[var(--space-gap-lg)] pr-10 text-text',
            'focus:border-accent-60',
            'disabled:opacity-35',
            error && 'border-red-40',
            className,
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {opciones.map((opcion) => (
            <option
              key={opcion.valor}
              value={opcion.valor}
              disabled={opcion.deshabilitada}
            >
              {opcion.etiqueta}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          size={16}
          strokeWidth={1.6}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary"
        />
      </div>
    </Field>
  )
}
