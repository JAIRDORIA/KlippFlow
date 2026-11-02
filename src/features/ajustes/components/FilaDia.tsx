import { X } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  aBorrador,
  bloqueNuevo,
  hayCambiosDia,
  validarDia,
  type BloqueBorrador,
  type DiaBorrador,
  type FilaHorario,
} from '@/features/ajustes/domain/horarios'
import { horaA12 } from '@/features/ajustes/domain/horas'
import { mensajeDeErrorAjustes } from '@/features/ajustes/domain/errores'
import { useGuardarDiaHorario } from '@/features/ajustes/hooks'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { Switch } from '@/shared/ui/Switch'
import { useToast } from '@/shared/ui/toast-context'

export interface FilaDiaProps {
  fila: FilaHorario
}

/**
 * Un día del editor de horarios: interruptor, bloques y guardado explícito.
 *
 * El estado local es un borrador; nada se manda hasta pulsar "Guardar".
 */
export function FilaDia({ fila }: FilaDiaProps) {
  const { mostrarToast } = useToast()
  const guardar = useGuardarDiaHorario()

  const inicial = aBorrador(fila.bloques)
  const [activado, setActivado] = useState(inicial.activado)
  const [bloques, setBloques] = useState<BloqueBorrador[]>(inicial.bloques)
  const [error, setError] = useState<string | null>(null)
  const siguienteClave = useRef(0)

  const dia: DiaBorrador = { diaSemana: fila.diaSemana, activado, bloques }
  const validacion = validarDia(dia)
  const cambios = hayCambiosDia(dia, fila.bloques)
  const pendiente = guardar.isPending
  const puedeGuardar = cambios && validacion.valido && !pendiente

  const nombreDia = fila.nombre.toLowerCase()
  const idErrorDia = `horario-error-${fila.diaSemana}`

  function nuevaClave(): string {
    const clave = `nuevo-${siguienteClave.current}`
    siguienteClave.current += 1
    return clave
  }

  function cambiarActivado(siguiente: boolean): void {
    setActivado(siguiente)
    setError(null)

    // Encender un día sin bloques crea el bloque por defecto del diseño.
    if (siguiente && bloques.length === 0) {
      setBloques([{ clave: nuevaClave(), horaInicio: '09:00', horaFin: '13:00' }])
    }
  }

  function cambiarHora(
    clave: string,
    campo: 'horaInicio' | 'horaFin',
    valor: string,
  ): void {
    setError(null)
    setBloques((actual) =>
      actual.map((bloque) => (bloque.clave === clave ? { ...bloque, [campo]: valor } : bloque)),
    )
  }

  function agregarBloque(): void {
    setError(null)
    setBloques((actual) => [...actual, bloqueNuevo(actual, nuevaClave())])
  }

  function quitarBloque(clave: string): void {
    setError(null)
    setBloques((actual) => actual.filter((bloque) => bloque.clave !== clave))
  }

  function descartar(): void {
    const nuevo = aBorrador(fila.bloques)
    setActivado(nuevo.activado)
    setBloques(nuevo.bloques)
    setError(null)
  }

  function guardarDia(): void {
    if (!puedeGuardar) return

    setError(null)
    guardar.mutate(
      { dia, servidor: fila.bloques },
      {
        onSuccess: () => {
          mostrarToast({ mensaje: `Horario del ${nombreDia} guardado`, duracionMs: 4000 })
        },
        onError: (fallo) => {
          setError(mensajeDeErrorAjustes(fallo, 'horario').mensaje)
        },
      },
    )
  }

  return (
    <li className="border-b border-line py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <p className="type-form font-medium text-text">{fila.nombre}</p>
        <Switch
          activo={activado}
          onCambio={cambiarActivado}
          etiqueta={`${fila.nombre} activo`}
          disabled={pendiente}
        />
      </div>

      <div
        className={cn(
          'mt-3 flex flex-col gap-3',
          !activado && 'opacity-[var(--opacity-inactive)]',
        )}
      >
        {bloques.length === 0 && (
          <p className="type-helper">
            {activado
              ? 'Sin bloques todavía. Agrega el primero.'
              : 'Día apagado. Enciéndelo para ofrecer horarios.'}
          </p>
        )}

        {bloques.map((bloque, indice) => {
          const idInicio = `horario-${fila.diaSemana}-inicio-${bloque.clave}`
          const idFin = `horario-${fila.diaSemana}-fin-${bloque.clave}`

          return (
            <div key={bloque.clave} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label htmlFor={idInicio} className="sr-only">
                  Hora de inicio del bloque {indice + 1} del {nombreDia}
                </label>
                <input
                  id={idInicio}
                  type="time"
                  step={900}
                  value={bloque.horaInicio}
                  aria-describedby={validacion.error ? idErrorDia : undefined}
                  disabled={!activado || pendiente}
                  onChange={(evento) =>
                    cambiarHora(bloque.clave, 'horaInicio', evento.target.value)
                  }
                  className="type-small h-[var(--height-input-time)] w-[104px] rounded-[var(--radius-input-time)] border border-line bg-card px-2 font-mono text-text focus:border-accent-60 disabled:opacity-35"
                />

                <span aria-hidden="true" className="text-dim">
                  –
                </span>

                <label htmlFor={idFin} className="sr-only">
                  Hora de fin del bloque {indice + 1} del {nombreDia}
                </label>
                <input
                  id={idFin}
                  type="time"
                  step={900}
                  value={bloque.horaFin}
                  aria-describedby={validacion.error ? idErrorDia : undefined}
                  disabled={!activado || pendiente}
                  onChange={(evento) =>
                    cambiarHora(bloque.clave, 'horaFin', evento.target.value)
                  }
                  className="type-small h-[var(--height-input-time)] w-[104px] rounded-[var(--radius-input-time)] border border-line bg-card px-2 font-mono text-text focus:border-accent-60 disabled:opacity-35"
                />

                <Button
                  variante="ghost"
                  tamano="compacto"
                  onClick={() => quitarBloque(bloque.clave)}
                  aria-label={`Quitar bloque ${indice + 1} del ${nombreDia}`}
                  disabled={pendiente}
                  className="ml-auto size-10 shrink-0 px-0"
                >
                  <X aria-hidden="true" size={18} strokeWidth={1.6} />
                </Button>
              </div>

              <p className="type-helper font-mono">
                {horaA12(bloque.horaInicio) || '—'} – {horaA12(bloque.horaFin) || '—'}
              </p>
            </div>
          )
        })}
      </div>

      {activado && (
        <Button
          variante="ghost"
          tamano="compacto"
          onClick={agregarBloque}
          disabled={pendiente}
          className="mt-2"
        >
          + Agregar bloque
        </Button>
      )}

      {validacion.error && (
        <p id={idErrorDia} role="alert" className="type-helper mt-2 text-red">
          {validacion.error}
        </p>
      )}

      {error && (
        <p role="alert" className="type-helper mt-2 text-red">
          {error}
        </p>
      )}

      {cambios && (
        <div className="mt-3 flex gap-2">
          <Button
            tamano="compacto"
            onClick={guardarDia}
            disabled={!puedeGuardar}
            aria-disabled={!puedeGuardar || undefined}
            cargando={pendiente}
            className="flex-1"
          >
            Guardar
          </Button>
          <Button
            variante="ghost"
            tamano="compacto"
            onClick={descartar}
            disabled={pendiente}
            className="flex-1"
          >
            Descartar
          </Button>
        </div>
      )}
    </li>
  )
}
