import { useState } from 'react'
import { aEnteroMonto } from '@/features/cuentas/domain/balance'
import {
  COMPRA_MAX_DIGITOS,
  DESCRIPCION_MAXIMA,
  hayCambios,
  mostrarContadorDescripcion,
  validarCompra,
} from '@/features/compras/domain/compra'
import { mensajeDeErrorCompra } from '@/features/compras/domain/errores'
import {
  esCambioDeEstado,
  useEditarCompra,
  useEliminarCompra,
} from '@/features/compras/hooks'
import type { Compra } from '@/features/compras/types'
import { fechaCorta } from '@/shared/lib/fechas'
import { formatearMilesEntrada } from '@/shared/lib/montos'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { MoneyInput } from '@/shared/ui/MoneyInput'
import { Sheet } from '@/shared/ui/Sheet'
import { useToast } from '@/shared/ui/toast-context'

export interface SheetEditarCompraProps {
  compra: Compra | null
  fecha: string
  onCerrar: () => void
}

/** Sheet "Editar compra" (DISENO.md 6.8), con confirmación de borrado. */
export function SheetEditarCompra({ compra, fecha, onCerrar }: SheetEditarCompraProps) {
  return (
    <Sheet
      abierto={compra !== null}
      onCerrar={onCerrar}
      titulo="Editar compra"
      descripcion={compra ? `Registrada el ${fechaCorta(compra.fechaBalance)}` : undefined}
    >
      {compra && (
        <ContenidoEditar key={compra.id} compra={compra} fecha={fecha} onCerrar={onCerrar} />
      )}
    </Sheet>
  )
}

function ContenidoEditar({
  compra,
  fecha,
  onCerrar,
}: {
  compra: Compra
  fecha: string
  onCerrar: () => void
}) {
  const { mostrarToast } = useToast()
  const editar = useEditarCompra(fecha)
  const eliminar = useEliminarCompra(fecha)

  const montoOriginal = aEnteroMonto(compra.monto)
  const [descripcion, setDescripcion] = useState(compra.descripcion)
  const [montoTexto, setMontoTexto] = useState(
    montoOriginal > 0 ? formatearMilesEntrada(String(montoOriginal)) : '',
  )
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tocadoDescripcion, setTocadoDescripcion] = useState(false)
  const [tocadoMonto, setTocadoMonto] = useState(false)

  const validacion = validarCompra({ descripcion, monto: montoTexto })
  const cambio =
    validacion.monto !== null &&
    hayCambios(
      { descripcion: compra.descripcion, monto: montoOriginal },
      { descripcion: validacion.descripcion, monto: validacion.monto },
    )
  const pendiente = editar.isPending || eliminar.isPending

  const errorDescripcion =
    tocadoDescripcion || descripcion.length > 0
      ? validacion.errores.descripcion
      : undefined
  const errorMonto =
    tocadoMonto || montoTexto.length > 0 ? validacion.errores.monto : undefined

  function guardar(): void {
    if (pendiente) return
    if (!validacion.valido || validacion.monto === null) {
      setTocadoDescripcion(true)
      setTocadoMonto(true)
      return
    }

    setError(null)
    editar.mutate(
      {
        id: compra.id,
        cambios: { descripcion: validacion.descripcion, monto: validacion.monto },
      },
      {
        onSuccess: () => {
          mostrarToast({ mensaje: 'Compra actualizada', duracionMs: 4000 })
          onCerrar()
        },
        onError: (fallo) => {
          const { mensaje } = mensajeDeErrorCompra(fallo)
          if (esCambioDeEstado(fallo)) {
            mostrarToast({ mensaje, duracionMs: 8000 })
            onCerrar()
            return
          }
          setError(mensaje)
        },
      },
    )
  }

  function confirmarEliminacion(): void {
    if (pendiente) return

    setError(null)
    eliminar.mutate(compra.id, {
      onSuccess: () => {
        mostrarToast({ mensaje: 'Compra eliminada', duracionMs: 4000 })
        onCerrar()
      },
      onError: (fallo) => {
        const { mensaje } = mensajeDeErrorCompra(fallo)
        if (esCambioDeEstado(fallo)) {
          mostrarToast({ mensaje, duracionMs: 8000 })
          onCerrar()
          return
        }
        setConfirmando(false)
        setError(mensaje)
      },
    })
  }

  if (confirmando) {
    return (
      <div className="flex flex-col gap-4">
        <p className="type-small text-secondary">
          Esta acción no se puede deshacer. La compra se elimina y el balance del día
          se ajusta.
        </p>

        {error && (
          <p role="alert" className="type-helper text-red">
            {error}
          </p>
        )}

        <Button
          variante="danger"
          onClick={confirmarEliminacion}
          disabled={pendiente}
          aria-disabled={pendiente || undefined}
          cargando={eliminar.isPending}
          className="w-full"
        >
          Sí, eliminar compra
        </Button>
        <Button
          variante="ghost"
          onClick={() => setConfirmando(false)}
          disabled={pendiente}
          className="w-full"
        >
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
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

      {error && (
        <p role="alert" className="type-helper text-red">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          onClick={guardar}
          disabled={!validacion.valido || !cambio || pendiente}
          aria-disabled={!validacion.valido || !cambio || pendiente || undefined}
          cargando={editar.isPending}
          className="w-full"
        >
          Guardar
        </Button>
        <Button
          variante="danger"
          onClick={() => setConfirmando(true)}
          disabled={pendiente}
          aria-disabled={pendiente || undefined}
          className="w-full"
        >
          Eliminar compra
        </Button>
      </div>
    </div>
  )
}
