import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Field } from './Field'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  etiqueta: string
  ayuda?: string
  error?: string
  id?: string
  /** Acción dentro del campo, alineada a la derecha (por ejemplo, ver contraseña). */
  accionDerecha?: ReactNode
}

export function Input({
  etiqueta,
  ayuda,
  error,
  id,
  className,
  accionDerecha,
  ...props
}: InputProps) {
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
        <input
          {...props}
          id={idCampo}
          aria-invalid={error ? true : undefined}
          aria-describedby={descritoPor || undefined}
          className={cn(
            'type-form h-[var(--height-input)] w-full rounded-[var(--radius-input)] border border-line bg-card px-[var(--space-gap-lg)] text-text',
            'placeholder:text-dim focus:border-accent-60',
            'disabled:opacity-35',
            error && 'border-red-40',
            accionDerecha
              ? 'pr-[calc(var(--space-gap-lg)+var(--height-button-compact))]'
              : null,
            className,
          )}
        />
        {accionDerecha && (
          <span className="absolute inset-y-0 right-1 flex items-center">
            {accionDerecha}
          </span>
        )}
      </div>
    </Field>
  )
}
