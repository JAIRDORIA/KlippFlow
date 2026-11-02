import { useId, useState } from 'react'
import {
  useCrearServicio,
  useDesactivarServicio,
  useEditarServicio,
  useReactivarServicio,
} from '@/features/ajustes/hooks'
import {
  DESCRIPCION_MAX,
  DURACION_DEFECTO,
  DURACION_MAX,
  DURACION_MIN,
  DURACION_PASO,
  PRECIO_MAX_DIGITOS,
  hayCambiosServicio,
  parsearDuracion,
  validarServicio,
} from '@/features/ajustes/domain/servicios'
import { mensajeDeErrorAjustes } from '@/features/ajustes/domain/errores'
import type { Servicio } from '@/features/ajustes/types'
import { formatearMilesEntrada } from '@/shared/lib/montos'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { Input } from '@/shared/ui/Input'
import { MoneyInput } from '@/shared/ui/MoneyInput'
import { Sheet } from '@/shared/ui/Sheet'
import { useToast } from '@/shared/ui/toast-context'

export interface SheetServicioProps {
  abierto: boolean
  /** null = nuevo servicio. */
  servicio: Servicio | null
  onCerrar: () => void
}

/** Sheet "Nuevo servicio" / "Editar servicio" (DISENO.md 6.9). */
export function SheetServicio({ abierto, servicio, onCerrar }: SheetServicioProps) {
  return (
    <Sheet
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={servicio ? 'Editar servicio' : 'Nuevo servicio'}
      descripcion={
        servicio ? undefined : 'Los servicios activos aparecen en tu página pública.'
      }
    >
      <ContenidoServicio
        key={servicio?.id ?? 'nuevo'}
        servicio={servicio}
        onCerrar={onCerrar}
      />
    </Sheet>
  )
}

function ContenidoServicio({
  servicio,
  onCerrar,
}: {
  servicio: Servicio | null
  onCerrar: () => void
}) {
  const { mostrarToast } = useToast()
  const crear = useCrearServicio()
  const editar = useEditarServicio()
  const desactivar = useDesactivarServicio()
  const reactivar = useReactivarServicio()
  const idDescripcion = useId()

  const precioInicial =
    servicio === null
      ? ''
      : formatearMilesEntrada(String(Math.trunc(Number(servicio.precio) || 0)))

  const [nombre, setNombre] = useState(servicio?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(servicio?.descripcion ?? '')
  const [precio, setPrecio] = useState(precioInicial)
  const [duracion, setDuracion] = useState(
    String(servicio?.duracionMinutos ?? DURACION_DEFECTO),
  )
  const [error, setError] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [tocado, setTocado] = useState({ nombre: false, precio: false, duracion: false })

  const validacion = validarServicio({ nombre, descripcion, precio, duracion })
  const cambio =
    servicio === null ||
    hayCambiosServicio(servicio, {
      nombre: validacion.nombre,
      descripcion: validacion.descripcion,
      precio: validacion.precio ?? 0,
      duracion: validacion.duracion ?? 0,
    })

  const pendiente =
    crear.isPending || editar.isPending || desactivar.isPending || reactivar.isPending
  const puedeGuardar = validacion.valido && cambio && !pendiente

  const errorNombre =
    tocado.nombre || nombre.length > 0 ? validacion.errores.nombre : undefined
  const errorPrecio =
    tocado.precio || precio.length > 0 ? validacion.errores.precio : undefined
  const errorDuracion =
    tocado.duracion || duracion.length > 0 ? validacion.errores.duracion : undefined
  const errorDescripcion = validacion.errores.descripcion

  function guardar(): void {
    if (pendiente) return

    if (!validacion.valido || validacion.precio === null || validacion.duracion === null) {
      setTocado({ nombre: true, precio: true, duracion: true })
      return
    }

    setError(null)
    const base = {
      nombre: validacion.nombre,
      precio: validacion.precio,
      duracionMinutos: validacion.duracion,
    }

    if (servicio) {
      editar.mutate(
        {
          id: servicio.id,
          cambios: { ...base, descripcion: validacion.descripcion ?? '' },
        },
        {
          onSuccess: () => {
            mostrarToast({ mensaje: 'Servicio actualizado', duracionMs: 4000 })
            onCerrar()
          },
          onError: (fallo) =>
            setError(mensajeDeErrorAjustes(fallo, 'servicio').mensaje),
        },
      )
      return
    }

    crear.mutate(
      {
        ...base,
        ...(validacion.descripcion ? { descripcion: validacion.descripcion } : {}),
      },
      {
        onSuccess: () => {
          mostrarToast({ mensaje: 'Servicio creado', duracionMs: 4000 })
          onCerrar()
        },
        onError: (fallo) => setError(mensajeDeErrorAjustes(fallo, 'servicio').mensaje),
      },
    )
  }

  function cambiarEstado(): void {
    if (!servicio || pendiente) return

    setError(null)
    const mutacion = servicio.activo ? desactivar : reactivar
    const mensaje = servicio.activo ? 'Servicio desactivado' : 'Servicio reactivado'

    mutacion.mutate(servicio.id, {
      onSuccess: () => {
        mostrarToast({ mensaje, duracionMs: 4000 })
        onCerrar()
      },
      onError: (fallo) => {
        setConfirmando(false)
        setError(mensajeDeErrorAjustes(fallo, 'servicio').mensaje)
      },
    })
  }

  function ajustarDuracion(delta: number): void {
    const actual = parsearDuracion(duracion) ?? DURACION_DEFECTO
    const siguiente = Math.min(DURACION_MAX, Math.max(DURACION_MIN, actual + delta))
    setDuracion(String(siguiente))
  }

  if (confirmando && servicio) {
    return (
      <div className="flex flex-col gap-4">
        <p className="type-small text-secondary">
          {servicio.activo
            ? 'El servicio deja de ofrecerse en tu página pública, pero las citas ya creadas no cambian.'
            : 'El servicio vuelve a aparecer en tu página pública con la misma duración y precio.'}
        </p>

        {error && (
          <p role="alert" className="type-helper text-red">
            {error}
          </p>
        )}

        <Button
          variante={servicio.activo ? 'danger' : 'primary'}
          onClick={cambiarEstado}
          disabled={pendiente}
          aria-disabled={pendiente || undefined}
          cargando={desactivar.isPending || reactivar.isPending}
          className="w-full"
        >
          {servicio.activo ? 'Sí, desactivar' : 'Sí, reactivar'}
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
        etiqueta="NOMBRE"
        value={nombre}
        onChange={(evento) => setNombre(evento.target.value)}
        onBlur={() => setTocado((actual) => ({ ...actual, nombre: true }))}
        placeholder="Ej. Corte clásico"
        error={errorNombre}
      />

      <Field
        etiqueta="DESCRIPCIÓN"
        htmlFor={idDescripcion}
        ayuda="Opcional"
        error={errorDescripcion}
        idError={`${idDescripcion}-error`}
      >
        <textarea
          id={idDescripcion}
          value={descripcion}
          rows={2}
          onChange={(evento) => setDescripcion(evento.target.value)}
          placeholder="Ej. Con tijera y máquina"
          aria-invalid={errorDescripcion ? true : undefined}
          aria-describedby={
            errorDescripcion ? `${idDescripcion}-error` : undefined
          }
          className="type-form w-full resize-none rounded-[var(--radius-input)] border border-line bg-card px-[var(--space-gap-lg)] py-[var(--space-gap)] text-text placeholder:text-dim focus:border-accent-60"
        />
      </Field>

      {descripcion.length > DESCRIPCION_MAX - 50 && (
        <p className="type-helper font-mono">
          {descripcion.length}/{DESCRIPCION_MAX}
        </p>
      )}

      <MoneyInput
        etiqueta="PRECIO"
        valor={precio}
        onCambio={setPrecio}
        onBlur={() => setTocado((actual) => ({ ...actual, precio: true }))}
        maxDigitos={PRECIO_MAX_DIGITOS}
        placeholder="0"
        ayuda="Entero en pesos, mínimo $1"
        error={errorPrecio}
      />

      <div className="flex flex-col gap-[var(--space-gap-sm)]">
        <Input
          etiqueta="DURACIÓN (MIN)"
          value={duracion}
          onChange={(evento) => setDuracion(evento.target.value)}
          onBlur={() => setTocado((actual) => ({ ...actual, duracion: true }))}
          inputMode="numeric"
          autoComplete="off"
          placeholder={String(DURACION_DEFECTO)}
          error={errorDuracion}
        />
        <div className="flex gap-2">
          <Button
            variante="ghost"
            tamano="compacto"
            onClick={() => ajustarDuracion(-DURACION_PASO)}
            aria-label="Quitar 5 minutos"
          >
            − 5
          </Button>
          <Button
            variante="ghost"
            tamano="compacto"
            onClick={() => ajustarDuracion(DURACION_PASO)}
            aria-label="Agregar 5 minutos"
          >
            + 5
          </Button>
        </div>
        <p className="type-helper">
          La duración define cuánto tiempo se bloquea en tu agenda.
        </p>
      </div>

      {error && (
        <p role="alert" className="type-helper text-red">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          onClick={guardar}
          disabled={!puedeGuardar}
          aria-disabled={!puedeGuardar || undefined}
          cargando={crear.isPending || editar.isPending}
          className="w-full"
        >
          Guardar
        </Button>

        {servicio && (
          <Button
            variante="danger"
            onClick={() => setConfirmando(true)}
            disabled={pendiente}
            aria-disabled={pendiente || undefined}
            className="w-full"
          >
            {servicio.activo ? 'Desactivar servicio' : 'Reactivar servicio'}
          </Button>
        )}
      </div>
    </div>
  )
}
