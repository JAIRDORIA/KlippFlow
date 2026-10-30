import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface FieldProps {
  etiqueta: string
  htmlFor: string
  ayuda?: string
  error?: string
  idAyuda?: string
  idError?: string
  obligatorio?: boolean
  className?: string
  children: ReactNode
}

export function Field({
  etiqueta,
  htmlFor,
  ayuda,
  error,
  idAyuda,
  idError,
  obligatorio = false,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-[var(--space-gap-sm)]', className)}>
      <label htmlFor={htmlFor} className="type-label">
        {etiqueta}
        {obligatorio && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {ayuda && (
        <p id={idAyuda} className="type-helper">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} role="alert" className="text-[var(--font-size-tiny)] text-red">
          {error}
        </p>
      )}
    </div>
  )
}
