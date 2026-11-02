import { useState } from 'react'
import { useCorregirPropina, useMarcarAtendido } from '@/features/agenda/hooks'
import {
  nombreCliente,
  propinaDeCita,
  serviciosDeCita,
} from '@/features/agenda/domain/agenda'
import { mensajeDeError } from '@/features/agenda/domain/errores'
import {
  ATAJOS_PROPINA,
  PROPINA_MAXIMA,
  PROPINA_MAX_DIGITOS,
  formatearMilesEntrada,
  validarPropina,
} from '@/features/agenda/domain/propina'
import type { CitaBarbero } from '@/features/agenda/types'
import { formatearPesos } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { Money } from '@/shared/ui/Money'
import { MoneyInput } from '@/shared/ui/MoneyInput'
import { Segmented } from '@/shared/ui/Segmented'
import { Sheet } from '@/shared/ui/Sheet'
import { useToast } from '@/shared/ui/toast-context'

export type ModoAtendido = 'atendido' | 'propina'

export interface SheetClienteAtendidoProps {
  cita: CitaBarbero | null
  modo: ModoAtendido
  onCerrar: () => void
}

const OPCIONES_PROPINA = [
  { valor: 'no', etiqueta: 'No' },
  { valor: 'si', etiqueta: 'Sí' },
] as const

type ValorPropina = (typeof OPCIONES_PROPINA)[number]['valor']

/**
 * Sheet "Cliente atendido" (DISENO.md 6.4).
 *
 * - Modo `atendido`: registra el cobro y una propina opcional.
 * - Modo `propina`: precarga la propina actual y permite corregirla o quitarla
 *   enviando 0.
 */
export function SheetClienteAtendido({
  cita,
  modo,
  onCerrar,
}: SheetClienteAtendidoProps) {
  const descripcion =
    modo === 'atendido'
      ? 'Confirma el cobro en persona. La propina es opcional.'
      : 'Corrige la propina de esta cita. Solo se puede el mismo día.'

  return (
    <Sheet
      abierto={cita !== null}
      onCerrar={onCerrar}
      titulo="Cliente atendido"
      descripcion={descripcion}
    >
      {cita && (
        <ContenidoAtendido
          key={`${cita.id}-${modo}`}
          cita={cita}
          modo={modo}
          onCerrar={onCerrar}
        />
      )}
    </Sheet>
  )
}

function ContenidoAtendido({
  cita,
  modo,
  onCerrar,
}: {
  cita: CitaBarbero
  modo: ModoAtendido
  onCerrar: () => void
}) {
  const { mostrarToast } = useToast()
  const mutacionAtendido = useMarcarAtendido()
  const mutacionPropina = useCorregirPropina()

  const propinaActual = propinaDeCita(cita)
  const [dejoPropina, setDejoPropina] = useState<ValorPropina>(
    modo === 'propina' && propinaActual > 0 ? 'si' : 'no',
  )
  const [textoPropina, setTextoPropina] = useState(
    propinaActual > 0 ? formatearMilesEntrada(String(propinaActual)) : '',
  )
  const [error, setError] = useState<string | null>(null)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  const permiteCero = modo === 'propina'
  const resultado = validarPropina(textoPropina, { permiteCero })
  const enviandoPropina = dejoPropina === 'si'
  const puedeConfirmar = enviandoPropina ? resultado.valido : true
  const pendiente = mutacionAtendido.isPending || mutacionPropina.isPending

  const total = cita.atencion?.montoCobrado ?? cita.montoTotal
  const servicios = serviciosDeCita(cita).join(' · ') || 'Servicio'

  function elegir(valor: ValorPropina): void {
    setDejoPropina(valor)
    setErrorLocal(null)
  }

  function usarAtajo(monto: number): void {
    setDejoPropina('si')
    setTextoPropina(formatearMilesEntrada(String(monto)))
    setErrorLocal(null)
  }

  function confirmar(): void {
    if (pendiente) return
    if (enviandoPropina && !resultado.valido) {
      setErrorLocal(resultado.error)
      return
    }

    setError(null)
    setErrorLocal(null)

    if (modo === 'atendido') {
      mutacionAtendido.mutate(
        {
          id: cita.id,
          montoPropina: enviandoPropina ? (resultado.monto ?? undefined) : undefined,
        },
        {
          onSuccess: () => {
            mostrarToast({
              mensaje: 'Atendido. Cobro registrado.',
              duracionMs: 8000,
            })
            onCerrar()
          },
          onError: (fallo) => setError(mensajeDeError('atendido', fallo).mensaje),
        },
      )
      return
    }

    const nuevoValor = enviandoPropina ? (resultado.monto ?? 0) : 0

    mutacionPropina.mutate(
      { id: cita.id, montoPropina: nuevoValor },
      {
        onSuccess: () => {
          mostrarToast({
            mensaje: nuevoValor > 0 ? 'Propina actualizada.' : 'Propina quitada.',
            duracionMs: 8000,
          })
          onCerrar()
        },
        onError: (fallo) => setError(mensajeDeError('propina', fallo).mensaje),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="type-base text-text">{nombreCliente(cita)}</p>

      <div className="rounded-[var(--radius-card)] border border-line bg-card p-5">
        <p className="type-eyebrow">
          {modo === 'atendido' ? 'COBRA EN PERSONA' : 'COBRADO EN PERSONA'}
        </p>
        <Money monto={total} tamano="total" className="mt-2 block text-text" />
        <p className="type-aux mt-2">Total completo · {servicios}</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="type-label">¿Dejó propina?</p>
        <Segmented
          etiqueta="¿Dejó propina?"
          opciones={OPCIONES_PROPINA}
          valor={dejoPropina}
          onCambio={elegir}
        />
      </div>

      {enviandoPropina && (
        <div className="flex flex-col gap-3">
          <MoneyInput
            etiqueta="Propina"
            valor={textoPropina}
            onCambio={setTextoPropina}
            maxDigitos={PROPINA_MAX_DIGITOS}
            placeholder="5.000"
            ayuda={`Entero entre $1 y ${formatearPesos(PROPINA_MAXIMA)}`}
            error={textoPropina.trim() ? (resultado.error ?? undefined) : undefined}
          />
          <div className="flex flex-wrap gap-2">
            {ATAJOS_PROPINA.map((monto) => (
              <Button
                key={monto}
                variante="ghost"
                tamano="compacto"
                onClick={() => usarAtajo(monto)}
              >
                {formatearPesos(monto)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {modo === 'propina' && !enviandoPropina && (
        <p className="type-helper">
          Se enviará 0: la propina se quita del balance de hoy.
        </p>
      )}

      {errorLocal && (
        <p role="alert" className="type-helper text-red">
          {errorLocal}
        </p>
      )}

      {error && (
        <p role="alert" className="type-helper text-red">
          {error}
        </p>
      )}

      <Button
        onClick={confirmar}
        disabled={!puedeConfirmar || pendiente}
        aria-disabled={!puedeConfirmar || pendiente || undefined}
        cargando={pendiente}
        className="w-full"
      >
        Confirmar cobro
      </Button>

      <p className="type-helper">
        Esta acción no se puede deshacer. La propina solo se corrige hoy.
      </p>
    </div>
  )
}
