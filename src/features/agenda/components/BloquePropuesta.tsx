import { Clock } from 'lucide-react'
import {
  calcularCuentaPropuesta,
  type PropuestaCambioHora,
} from '@/shared/lib/propuestaCambioHora'
import { cn } from '@/shared/lib/cn'
import { etiquetaDia, hora12 } from '@/shared/lib/fechas'
import { useAhora } from '@/shared/lib/useAhora'

export interface BloquePropuestaProps {
  propuesta: PropuestaCambioHora
  /** Solo llega cuando el backend conoce la barbería (dashboard y acciones). */
  whatsappUrl?: string
  className?: string
}

/**
 * Estado "Esperando respuesta del cliente" de una propuesta vigente.
 *
 * La cuenta regresiva se recalcula con el reloj de la interfaz a partir de
 * `expiraEn`; el backend sigue siendo la fuente de verdad.
 */
export function BloquePropuesta({
  propuesta,
  whatsappUrl,
  className,
}: BloquePropuestaProps) {
  const ahora = useAhora(30_000)
  const cuenta = calcularCuentaPropuesta(propuesta, ahora)

  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 rounded-[var(--radius-warning)] border border-amber-30 bg-amber-10 p-[var(--space-warning)] text-amber',
        className,
      )}
    >
      <p className="type-eyebrow text-amber">NUEVA HORA PROPUESTA</p>

      <p className="type-small font-mono tabular-nums">
        {etiquetaDia(propuesta.fecha)} · {hora12(propuesta.horaInicio)} –{' '}
        {hora12(propuesta.horaFin)}
      </p>

      <p className="type-helper inline-flex items-center gap-1.5" aria-live="polite">
        <Clock aria-hidden="true" size={14} strokeWidth={1.6} />
        Esperando respuesta · {cuenta?.texto ?? 'propuesta vigente'}
      </p>

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="type-small inline-flex min-h-[var(--height-button-compact)] items-center font-medium text-amber underline underline-offset-2 hover:text-text"
        >
          Avisar por WhatsApp
        </a>
      )}
    </div>
  )
}
