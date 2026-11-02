import { useCallback, useState } from 'react'
import { useAhora } from '@/shared/lib/useAhora'
import { cn } from '@/shared/lib/cn'
import { formatearPesos } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EstadoError } from '@/shared/ui/EstadoError'
import { Input } from '@/shared/ui/Input'
import { MoneyInput } from '@/shared/ui/MoneyInput'
import { ScreenHeader } from '@/shared/ui/ScreenHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useToast } from '@/shared/ui/toast-context'
import { aEnteroMonto } from '@/features/cuentas/domain/balance'
import { fechaConsulta } from '@/features/cuentas/domain/dia'
import {
  COMPRA_MAX_DIGITOS,
  DESCRIPCION_MAXIMA,
  mostrarContadorDescripcion,
  validarCompra,
} from './domain/compra'
import { mensajeDeErrorCompra } from './domain/errores'
import { useCompras, useCrearCompra } from './hooks'
import { SheetEditarCompra } from './components/SheetEditarCompra'
import type { Compra } from './types'

const ID_DESCRIPCION = 'compra-descripcion'

/** Pantalla Compras (`/app/compras`), como DISENO.md 6.8. */
export function ComprasPage() {
  const ahora = useAhora(60_000)
  const hoy = fechaConsulta(new Date(ahora))

  const compras = useCompras(hoy)
  const crear = useCrearCompra(hoy)
  const { mostrarToast } = useToast()

  const [descripcion, setDescripcion] = useState('')
  const [montoTexto, setMontoTexto] = useState('')
  const [tocadoDescripcion, setTocadoDescripcion] = useState(false)
  const [tocadoMonto, setTocadoMonto] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [edicion, setEdicion] = useState<Compra | null>(null)

  const cerrarEdicion = useCallback(() => setEdicion(null), [])

  const validacion = validarCompra({ descripcion, monto: montoTexto })
  const pendiente = crear.isPending

  const errorDescripcion =
    tocadoDescripcion || descripcion.length > 0
      ? validacion.errores.descripcion
      : undefined
  const errorMonto =
    tocadoMonto || montoTexto.length > 0 ? validacion.errores.monto : undefined

  function registrar(): void {
    if (pendiente) return
    if (!validacion.valido || validacion.monto === null) {
      setTocadoDescripcion(true)
      setTocadoMonto(true)
      return
    }

    setErrorEnvio(null)
    crear.mutate(
      { descripcion: validacion.descripcion, monto: validacion.monto },
      {
        onSuccess: () => {
          setDescripcion('')
          setMontoTexto('')
          setTocadoDescripcion(false)
          setTocadoMonto(false)
          mostrarToast({ mensaje: 'Compra registrada', duracionMs: 4000 })
          document.getElementById(ID_DESCRIPCION)?.focus()
        },
        onError: (error) => setErrorEnvio(mensajeDeErrorCompra(error).mensaje),
      },
    )
  }

  const lista = compras.data?.compras ?? []
  const total = aEnteroMonto(compras.data?.total)

  return (
    <main className="screen screen-with-nav">
      <ScreenHeader eyebrow="INSUMOS · SALIDA DE CAJA" titulo="Compras" />

      <Card className="mt-7 flex flex-col gap-4">
        <Input
          id={ID_DESCRIPCION}
          etiqueta="DESCRIPCIÓN"
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
          onBlur={() => setTocadoDescripcion(true)}
          placeholder="Ej. Gel fijador x2"
          error={errorDescripcion}
          ayuda={
            mostrarContadorDescripcion(descripcion)
              ? `${descripcion.length}/${DESCRIPCION_MAXIMA}`
              : undefined
          }
        />

        <MoneyInput
          etiqueta="MONTO"
          valor={montoTexto}
          onCambio={setMontoTexto}
          onBlur={() => setTocadoMonto(true)}
          maxDigitos={COMPRA_MAX_DIGITOS}
          placeholder="0"
          ayuda="Entre $1 y $50.000.000"
          error={errorMonto}
        />

        {errorEnvio && (
          <p role="alert" className="type-helper text-red">
            {errorEnvio}
          </p>
        )}

        <Button
          onClick={registrar}
          disabled={!validacion.valido || pendiente}
          aria-disabled={!validacion.valido || pendiente || undefined}
          cargando={pendiente}
          className="w-full"
        >
          Registrar compra
        </Button>
      </Card>

      <section className="mt-9 pb-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="type-card-title">Hoy</h2>
          <span className="font-mono text-[var(--font-size-form)] tabular-nums text-secondary">
            {formatearPesos(total)}
          </span>
        </div>

        {compras.isPending && <CargandoCompras />}

        {compras.isError && !compras.data && (
          <div className="mt-4">
            <EstadoError
              mensaje="No pudimos cargar tus compras. Revisa tu conexión e inténtalo de nuevo."
              onReintentar={() => void compras.refetch()}
              reintentando={compras.isFetching}
            />
          </div>
        )}

        {compras.data && lista.length === 0 && (
          <p className="type-aux mt-3">Aún no hay compras hoy</p>
        )}

        {lista.length > 0 && (
          <ul className="mt-1">
            {lista.map((compra, indice) => (
              <li
                key={compra.id}
                className={cn(indice < lista.length - 1 && 'border-b border-line')}
              >
                <button
                  type="button"
                  onClick={() => setEdicion(compra)}
                  className="kf-press flex min-h-[var(--height-button)] w-full items-center justify-between gap-3 py-3 text-left"
                >
                  <span className="type-small min-w-0 flex-1 truncate text-text">
                    {compra.descripcion}
                  </span>
                  <span className="shrink-0 font-mono text-[var(--font-size-small)] tabular-nums text-red">
                    {formatearPesos(-aEnteroMonto(compra.monto), { lista: true })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SheetEditarCompra compra={edicion} fecha={hoy} onCerrar={cerrarEdicion} />
    </main>
  )
}

function CargandoCompras() {
  return (
    <div className="mt-3 flex flex-col gap-3">
      <Skeleton className="h-[52px] w-full" />
      <Skeleton className="h-[52px] w-full" />
      <Skeleton className="h-[52px] w-full" />
    </div>
  )
}
