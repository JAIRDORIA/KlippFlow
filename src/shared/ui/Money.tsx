import { cn } from '@/shared/lib/cn'
import { formatearPesos } from '@/shared/lib/format'

export type TamanoMoney = 'base' | 'destacado' | 'resumen' | 'total' | 'principal'

export interface MoneyProps {
  monto: number | string | null | undefined
  tamano?: TamanoMoney
  lista?: boolean
  colorPorSigno?: boolean
  className?: string
}

const tamanos: Record<TamanoMoney, string> = {
  base: 'text-[var(--font-size-form)]',
  destacado: 'text-[var(--font-size-highlight)]',
  resumen: 'text-[var(--font-size-metric)]',
  total: 'text-[var(--font-size-total)]',
  principal: 'text-[var(--font-size-metric-xl)]',
}

export function Money({
  monto,
  tamano = 'base',
  lista = false,
  colorPorSigno = false,
  className,
}: MoneyProps) {
  const numero = typeof monto === 'number' ? monto : Number(monto)
  const esCero = !Number.isFinite(numero) || numero === 0
  const esNegativo = Number.isFinite(numero) && numero < 0

  return (
    <span
      className={cn(
        'font-mono tabular-nums',
        tamanos[tamano],
        esCero && colorPorSigno && 'text-dim',
        esNegativo && colorPorSigno && 'text-red',
        className,
      )}
    >
      {formatearPesos(monto, { lista })}
    </span>
  )
}
