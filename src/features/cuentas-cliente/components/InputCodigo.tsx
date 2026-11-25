import { Input, type InputProps } from '@/shared/ui/Input'
import { LARGO_CODIGO, normalizarCodigo } from '../domain/validadores'

interface InputCodigoProps
  extends Omit<InputProps, 'value' | 'onChange' | 'etiqueta'> {
  valor: string
  onCambio: (codigo: string) => void
  etiqueta?: string
}

/**
 * Código de 6 dígitos enviado por correo. Teclado numérico, pero el valor se
 * guarda como string para no perder los ceros a la izquierda.
 */
export function InputCodigo({
  valor,
  onCambio,
  etiqueta = 'Código de 6 dígitos',
  ...props
}: InputCodigoProps) {
  return (
    <Input
      etiqueta={etiqueta}
      name="codigo"
      value={valor}
      onChange={(evento) => onCambio(normalizarCodigo(evento.target.value))}
      inputMode="numeric"
      pattern="\d{6}"
      maxLength={LARGO_CODIGO}
      autoComplete="one-time-code"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      placeholder="000000"
      className="tracking-[0.4em]"
      {...props}
    />
  )
}
