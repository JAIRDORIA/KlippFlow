import { useId, type ClipboardEvent, type ChangeEvent } from 'react'
import { cn } from '@/shared/lib/cn'
import { formatearMilesEntrada, limpiarMontoEscrito } from '@/shared/lib/montos'
import { Field } from './Field'

export interface MoneyInputProps {
  etiqueta: string
  /** Texto tal como se muestra (con puntos de miles). */
  valor: string
  onCambio: (valor: string) => void
  ayuda?: string
  error?: string
  placeholder?: string
  id?: string
  /** Dígitos máximos que se conservan (propina: 7; compras: 8). */
  maxDigitos?: number
  autoFocus?: boolean
  disabled?: boolean
  onBlur?: () => void
  className?: string
}

/**
 * Campo de monto entero en pesos con teclado numérico y puntos de miles.
 *
 * - Mientras se escribe se agrupan los miles ("27000" → "27.000").
 * - Al pegar se conservan solo los dígitos ("$27.000" → "27.000").
 * - Si se escribe algo que no es dígito ni punto (coma, letra, signo) el
 *   carácter se mantiene para que la validación explique el error; ningún
 *   valor inválido llega a la API.
 *
 * Compartido por el sheet de propina y el formulario de compras.
 */
export function MoneyInput({
  etiqueta,
  valor,
  onCambio,
  ayuda,
  error,
  placeholder,
  id,
  maxDigitos,
  autoFocus,
  disabled,
  onBlur,
  className,
}: MoneyInputProps) {
  const idGenerado = useId()
  const idCampo = id ?? idGenerado
  const idAyuda = `${idCampo}-ayuda`
  const idError = `${idCampo}-error`
  const descritoPor = [ayuda ? idAyuda : null, error ? idError : null]
    .filter(Boolean)
    .join(' ')

  function manejarCambio(evento: ChangeEvent<HTMLInputElement>): void {
    const crudo = evento.target.value
    const limpio = limpiarMontoEscrito(crudo)

    // Un carácter inválido se conserva sin formatear para que la validación
    // lo marque; así no se convierten decimales en enteros por accidente.
    if (/[^\d.]/.test(limpio)) {
      onCambio(limpio)
      return
    }

    onCambio(formatearMilesEntrada(limpio, maxDigitos))
  }

  function manejarPegado(evento: ClipboardEvent<HTMLInputElement>): void {
    const texto = evento.clipboardData.getData('text')
    if (!texto) return

    evento.preventDefault()
    const formateado = formatearMilesEntrada(texto, maxDigitos)
    if (!formateado) return
    onCambio(formateado)
  }

  return (
    <Field
      etiqueta={etiqueta}
      htmlFor={idCampo}
      ayuda={ayuda}
      error={error}
      idAyuda={idAyuda}
      idError={idError}
    >
      <input
        id={idCampo}
        value={valor}
        onChange={manejarCambio}
        onPaste={manejarPegado}
        onBlur={onBlur}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={descritoPor || undefined}
        className={cn(
          'type-form h-[var(--height-input)] w-full rounded-[var(--radius-input)] border border-line bg-card px-[var(--space-gap-lg)] font-mono tabular-nums text-text',
          'placeholder:font-sans placeholder:text-dim focus:border-accent-60',
          'disabled:opacity-35',
          error && 'border-red-40',
          className,
        )}
      />
    </Field>
  )
}
