import { useAhora } from '@/shared/lib/useAhora'
import { cn } from '@/shared/lib/cn'
import { formatearPesos } from '@/shared/lib/format'
import { Card } from '@/shared/ui/Card'
import { EstadoError } from '@/shared/ui/EstadoError'
import { Money } from '@/shared/ui/Money'
import { ScreenHeader } from '@/shared/ui/ScreenHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import { GraficoNeto } from './components/GraficoNeto'
import { useBalanceHoy, useHistorialBalance } from './hooks'
import {
  calcularFilasBalance,
  construirDiasLista,
  historialTodoEnCero,
  type TonoNeto,
} from './domain/balance'
import { fechaConsulta } from './domain/dia'
import type { Balance } from './types'

const TONO_FILA: Record<TonoNeto, string> = {
  positivo: 'text-text',
  negativo: 'text-red',
  cero: 'text-dim',
}

const TONO_NETO: Record<TonoNeto, string> = {
  positivo: 'text-text',
  negativo: 'text-red',
  cero: 'text-dim',
}

/** Pantalla Cuentas (`/app/cuentas`), como DISENO.md 6.7. */
export function CuentasPage() {
  const ahora = useAhora(60_000)
  const hoy = fechaConsulta(new Date(ahora))

  const balance = useBalanceHoy(hoy)
  const historial = useHistorialBalance(hoy)

  const cargando = balance.isPending || historial.isPending
  const hayError =
    (balance.isError && !balance.data) || (historial.isError && !historial.data)

  function reintentar(): void {
    void balance.refetch()
    void historial.refetch()
  }

  return (
    <main className="screen screen-with-nav">
      <ScreenHeader
        eyebrow="HOY · SE REINICIA 12:00 A. M. BOGOTÁ"
        titulo="Cuentas"
      />

      {cargando && <CargandoCuentas />}

      {!cargando && hayError && (
        <div className="mt-7">
          <EstadoError
            mensaje="No pudimos cargar tus cuentas. Revisa tu conexión e inténtalo de nuevo."
            onReintentar={reintentar}
            reintentando={balance.isFetching || historial.isFetching}
          />
        </div>
      )}

      {balance.data && <TarjetaFinanciera balance={balance.data} />}

      {historial.data && (
        <>
          <GraficoNeto historial={historial.data} fechaHoy={hoy} />
          <ListaDias historial={historial.data} fechaHoy={hoy} />
        </>
      )}
    </main>
  )
}

function TarjetaFinanciera({ balance }: { balance: Balance }) {
  const filas = calcularFilasBalance(balance)

  return (
    <Card variante="financiera" className="mt-7">
      <p className="type-label">GANANCIA NETA</p>
      <Money
        monto={balance.gananciaNeta}
        tamano="principal"
        colorPorSigno
        className="mt-2 block"
      />

      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
        {filas.map((fila) => (
          <div key={fila.clave} className="flex items-baseline justify-between gap-3">
            <span className="type-small text-secondary">{fila.etiqueta}</span>
            <span
              className={cn(
                'font-mono text-[var(--font-size-form)] tabular-nums',
                TONO_FILA[fila.tono],
              )}
            >
              {fila.signo ? `${fila.signo} ` : ''}
              {formatearPesos(fila.valor)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ListaDias({
  historial,
  fechaHoy,
}: {
  historial: readonly Balance[]
  fechaHoy: string
}) {
  const dias = construirDiasLista(historial, fechaHoy)
  const sinMovimientos = historialTodoEnCero(historial)

  return (
    <section className="mt-9 pb-4">
      <h2 className="type-card-title">Días anteriores</h2>

      {sinMovimientos || dias.length === 0 ? (
        <p className="type-aux mt-3">Aún no hay movimientos</p>
      ) : (
        <ul className="mt-3">
          {dias.map((dia, indice) => (
            <li
              key={dia.fecha}
              className={cn(
                'flex min-h-[var(--height-button-compact)] items-center justify-between gap-3 py-3',
                indice < dias.length - 1 && 'border-b border-line',
              )}
            >
              <span className="type-small text-secondary">{dia.etiqueta}</span>
              <span
                className={cn(
                  'font-mono text-[var(--font-size-small)] tabular-nums',
                  TONO_NETO[dia.tono],
                )}
              >
                {formatearPesos(dia.valor)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CargandoCuentas() {
  return (
    <div className="mt-7 flex flex-col gap-6">
      <Skeleton className="h-[196px] w-full" />
      <Skeleton className="h-[112px] w-full" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-[52px] w-full" />
        <Skeleton className="h-[52px] w-full" />
        <Skeleton className="h-[52px] w-full" />
      </div>
    </div>
  )
}
