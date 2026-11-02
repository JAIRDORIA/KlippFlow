import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Segmented } from '@/shared/ui/Segmented'
import { Sheet } from '@/shared/ui/Sheet'
import { useToast } from '@/shared/ui/toast-context'
import { linkReservasDe } from '../domain/enlaces'
import { textoDeErrorAdmin } from '../domain/errores'
import {
  EFECTO_ESTADO,
  ETIQUETA_ESTADO,
  OPCIONES_ESTADO,
} from '../domain/estado'
import { validarPassword } from '../domain/formulario'
import { generarPasswordProvisional } from '../domain/password'
import { nombreCompleto } from '../domain/texto'
import { useCambiarEstado, useRestablecerClave, useRotarCodigo } from '../hooks'
import type { BarberoAdmin, EstadoCuenta } from '../types'
import { PildoraEstado } from './PildoraEstado'
import { SecretoCopiable } from './SecretoCopiable'

type Paso =
  | 'detalle'
  | 'confirmar-estado'
  | 'confirmar-codigo'
  | 'codigo-listo'
  | 'confirmar-clave'
  | 'clave-lista'

export interface SheetDetalleBarberoProps {
  barbero: BarberoAdmin
  onCerrar: () => void
}

/**
 * Sheet de detalle con estado, rotación de código y restablecimiento.
 * Se monta al abrir y se desmonta al cerrar: los datos de una sola vez se
 * descartan solos.
 */
export function SheetDetalleBarbero({ barbero, onCerrar }: SheetDetalleBarberoProps) {
  return (
    <Sheet abierto onCerrar={onCerrar} titulo="Detalle del barbero">
      <ContenidoDetalle barbero={barbero} onCerrar={onCerrar} />
    </Sheet>
  )
}

function ContenidoDetalle({
  barbero,
  onCerrar,
}: {
  barbero: BarberoAdmin
  onCerrar: () => void
}) {
  const { mostrarToast } = useToast()
  const cambiarEstado = useCambiarEstado()
  const rotar = useRotarCodigo()
  const restablecer = useRestablecerClave()

  const [paso, setPaso] = useState<Paso>('detalle')
  const [estado, setEstado] = useState<EstadoCuenta>(barbero.estadoCuenta)
  const [estadoElegido, setEstadoElegido] = useState<EstadoCuenta | null>(null)
  const [codigo, setCodigo] = useState(barbero.codigoUnico)
  const [link, setLink] = useState(() => linkReservasDe(barbero))
  const [nuevaClave, setNuevaClave] = useState('')
  const [mostrarClave, setMostrarClave] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ocupado =
    cambiarEstado.isPending || rotar.isPending || restablecer.isPending
  const errorClave = nuevaClave ? validarPassword(nuevaClave) : null

  function volverAlDetalle(): void {
    setPaso('detalle')
    setError(null)
    setEstadoElegido(null)
  }

  function elegirEstado(siguiente: EstadoCuenta): void {
    if (siguiente === estado) return
    setError(null)
    setEstadoElegido(siguiente)
    setPaso('confirmar-estado')
  }

  function confirmarEstado(): void {
    if (!estadoElegido || ocupado) return

    const destino = estadoElegido
    setError(null)

    cambiarEstado.mutate(
      { id: barbero.id, estado: destino },
      {
        onSuccess: () => {
          setEstado(destino)
          volverAlDetalle()
          mostrarToast({
            mensaje: `Estado cambiado a ${ETIQUETA_ESTADO[destino].toLowerCase()}`,
            duracionMs: 4000,
          })
        },
        onError: (fallo) => {
          setError(textoDeErrorAdmin(fallo))
          setPaso('detalle')
        },
      },
    )
  }

  function confirmarRotacion(): void {
    if (ocupado) return

    setError(null)
    rotar.mutate(barbero.id, {
      onSuccess: (resultado) => {
        setCodigo(resultado.codigoUnico)
        setLink(resultado.linkReservas)
        setPaso('codigo-listo')
        mostrarToast({ mensaje: 'Código rotado', duracionMs: 4000 })
      },
      onError: (fallo) => {
        setError(textoDeErrorAdmin(fallo))
        setPaso('detalle')
      },
    })
  }

  function abrirRestablecer(): void {
    if (ocupado) return
    setError(null)
    setNuevaClave('')
    setMostrarClave(false)
    setPaso('confirmar-clave')
  }

  function confirmarRestablecer(): void {
    if (ocupado) return

    const problema = validarPassword(nuevaClave)
    if (problema) {
      setError(problema)
      return
    }

    setError(null)
    restablecer.mutate(
      { id: barbero.id, password: nuevaClave },
      {
        onSuccess: () => {
          setPaso('clave-lista')
          mostrarToast({ mensaje: 'Contraseña restablecida', duracionMs: 4000 })
        },
        onError: (fallo) => setError(textoDeErrorAdmin(fallo)),
      },
    )
  }

  function generarClave(): void {
    setNuevaClave(generarPasswordProvisional())
    setMostrarClave(true)
    setError(null)
  }

  function cerrarListo(): void {
    setNuevaClave('')
    volverAlDetalle()
  }

  if (paso === 'confirmar-estado' && estadoElegido) {
    return (
      <div className="flex flex-col gap-4">
        <p className="type-small text-text">
          ¿Cambiar el estado a {ETIQUETA_ESTADO[estadoElegido].toLowerCase()}?
        </p>
        <p className="type-helper">{EFECTO_ESTADO[estadoElegido]}</p>

        {error && (
          <p role="alert" className="type-helper text-red">
            {error}
          </p>
        )}

        <Button
          onClick={confirmarEstado}
          disabled={ocupado}
          aria-disabled={ocupado || undefined}
          cargando={cambiarEstado.isPending}
          className="w-full"
        >
          Sí, cambiar a {ETIQUETA_ESTADO[estadoElegido].toLowerCase()}
        </Button>
        <Button
          variante="ghost"
          onClick={volverAlDetalle}
          disabled={ocupado}
          className="w-full"
        >
          Cancelar
        </Button>
      </div>
    )
  }

  if (paso === 'confirmar-codigo') {
    return (
      <div className="flex flex-col gap-4">
        <p className="type-small text-text">Se generará un código nuevo.</p>
        <p className="type-helper">
          El link que ya compartiste dejará de funcionar y tendrás que enviar el
          nuevo. Las citas existentes siguen funcionando.
        </p>

        {error && (
          <p role="alert" className="type-helper text-red">
            {error}
          </p>
        )}

        <Button
          variante="danger"
          onClick={confirmarRotacion}
          disabled={ocupado}
          aria-disabled={ocupado || undefined}
          cargando={rotar.isPending}
          className="w-full"
        >
          Sí, rotar código
        </Button>
        <Button
          variante="ghost"
          onClick={volverAlDetalle}
          disabled={ocupado}
          className="w-full"
        >
          Cancelar
        </Button>
      </div>
    )
  }

  if (paso === 'codigo-listo') {
    return (
      <div className="flex flex-col gap-4">
        <div aria-live="polite" className="flex flex-col gap-3">
          <p className="type-form font-medium text-text">Código nuevo</p>
          <SecretoCopiable etiqueta="Código" valor={codigo} />
          <SecretoCopiable etiqueta="Link de reservas" valor={link} />
          <p className="type-helper">
            Compártelo ahora: el link anterior ya no funciona.
          </p>
        </div>

        <Button onClick={cerrarListo} className="w-full">
          Listo
        </Button>
      </div>
    )
  }

  if (paso === 'confirmar-clave') {
    return (
      <div className="flex flex-col gap-4">
        <p className="type-small text-text">
          Escribe la contraseña nueva para {nombreCompleto(barbero)}.
        </p>
        <p className="type-helper">
          La contraseña anterior dejará de servir. Los tokens ya emitidos no se
          revocan: expiran solos.
        </p>

        <Input
          id="detalle-clave"
          etiqueta="Contraseña nueva"
          ayuda="Entre 8 y 72 caracteres"
          type={mostrarClave ? 'text' : 'password'}
          value={nuevaClave}
          onChange={(evento) => {
            setNuevaClave(evento.target.value)
            setError(null)
          }}
          error={errorClave ?? undefined}
          autoComplete="new-password"
          accionDerecha={
            <button
              type="button"
              aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={mostrarClave}
              aria-controls="detalle-clave"
              onMouseDown={(evento) => evento.preventDefault()}
              onClick={() => setMostrarClave((visible) => !visible)}
              className="inline-flex size-[var(--height-button-compact)] items-center justify-center rounded-[var(--radius-button-card)] text-secondary hover:bg-white-5 hover:text-text"
            >
              {mostrarClave ? (
                <EyeOff aria-hidden="true" size={18} strokeWidth={1.6} />
              ) : (
                <Eye aria-hidden="true" size={18} strokeWidth={1.6} />
              )}
            </button>
          }
        />

        <Button variante="ghost" onClick={generarClave} className="w-full">
          Generar contraseña
        </Button>

        {error && (
          <p role="alert" className="type-helper text-red">
            {error}
          </p>
        )}

        <Button
          variante="danger"
          onClick={confirmarRestablecer}
          disabled={ocupado || Boolean(errorClave) || nuevaClave.length === 0}
          aria-disabled={ocupado || undefined}
          cargando={restablecer.isPending}
          className="w-full"
        >
          Restablecer contraseña
        </Button>
        <Button
          variante="ghost"
          onClick={volverAlDetalle}
          disabled={ocupado}
          className="w-full"
        >
          Cancelar
        </Button>
      </div>
    )
  }

  if (paso === 'clave-lista') {
    return (
      <div className="flex flex-col gap-4">
        <div aria-live="polite" className="flex flex-col gap-3">
          <p className="type-form font-medium text-text">Contraseña nueva</p>
          <SecretoCopiable etiqueta="Contraseña" valor={nuevaClave} />
          <p className="type-helper">
            Se muestra una sola vez. La contraseña anterior ya no sirve.
          </p>
        </div>

        <Button onClick={cerrarListo} className="w-full">
          Listo
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="type-form font-medium text-text">{nombreCompleto(barbero)}</p>
          {barbero.nombreBarberia && (
            <p className="type-helper mt-1">{barbero.nombreBarberia}</p>
          )}
        </div>
        <PildoraEstado estado={estado} />
      </div>

      <dl className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <dt className="type-label">Usuario</dt>
          <dd className="type-small break-all font-mono text-text">{barbero.username}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="type-label">Correo</dt>
          <dd className="type-small break-all text-secondary">{barbero.correo}</dd>
        </div>
      </dl>

      <SecretoCopiable etiqueta="Código" valor={codigo} />
      <SecretoCopiable etiqueta="Link de reservas" valor={link} />
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="kf-press type-small inline-flex h-[var(--height-button-compact)] items-center justify-center self-start rounded-[var(--radius-button-card)] bg-transparent px-[var(--padding-button-compact-x)] font-medium text-text hover:bg-white-5"
      >
        Abrir como cliente
      </a>

      <div className="flex flex-col gap-2">
        <p className="type-label">Estado de la cuenta</p>
        <Segmented
          opciones={OPCIONES_ESTADO}
          valor={estado}
          onCambio={elegirEstado}
          etiqueta="Estado de la cuenta"
        />
        <p className="type-helper">{EFECTO_ESTADO[estado]}</p>
      </div>

      {error && (
        <p role="alert" className="type-helper text-red">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          variante="danger"
          onClick={() => {
            setError(null)
            setPaso('confirmar-codigo')
          }}
          disabled={ocupado}
          className="w-full"
        >
          Rotar código
        </Button>
        <Button
          variante="danger"
          onClick={abrirRestablecer}
          disabled={ocupado}
          className="w-full"
        >
          Restablecer contraseña
        </Button>
        <Button variante="ghost" onClick={onCerrar} className="w-full">
          Cerrar
        </Button>
      </div>
    </div>
  )
}
