import {
  ALTO_MAXIMO_BARRA,
  construirBarras,
  textoAccesibilidadGrafico,
  type BarraGrafico,
} from '@/features/cuentas/domain/balance'
import type { Balance } from '@/features/cuentas/types'
import { cn } from '@/shared/lib/cn'

export interface GraficoNetoProps {
  historial: readonly Balance[]
  fechaHoy: string
}

function colorDeBarra(barra: BarraGrafico): string {
  if (barra.esHoy) return 'bg-accent'
  return barra.negativa ? 'bg-red-70' : 'bg-white-15'
}

/**
 * Gráfico "Últimos 30 días · neto diario" (DISENO.md 6.7).
 *
 * Solo CSS: 30 barras de izquierda (más antiguo) a derecha (hoy), sin
 * interacción. El resumen completo va en el `aria-label`.
 */
export function GraficoNeto({ historial, fechaHoy }: GraficoNetoProps) {
  const barras = construirBarras(historial, fechaHoy)
  const etiqueta = textoAccesibilidadGrafico(barras)

  return (
    <section className="mt-9">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="type-card-title">Últimos 30 días</h2>
        <span className="type-helper">neto diario</span>
      </div>

      <div
        role="img"
        aria-label={etiqueta}
        className="mt-4 flex items-end gap-[var(--space-chart-gap)]"
        style={{ height: ALTO_MAXIMO_BARRA }}
      >
        {barras.map((barra) => (
          <span
            key={barra.fecha}
            aria-hidden="true"
            className={cn(
              'flex-1 rounded-[var(--radius-chart)]',
              colorDeBarra(barra),
            )}
            style={{ height: barra.altura }}
          />
        ))}
      </div>
    </section>
  )
}
