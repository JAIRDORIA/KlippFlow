import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Sheet } from '@/shared/ui/Sheet'
import { useToast } from '@/shared/ui/toast-context'
import { linkReservasDe } from '../domain/enlaces'
import { textoEntrega } from '../domain/entrega'
import { textoDeErrorAdmin } from '../domain/errores'
import { validarFormularioBarbero, type EntradaBarbero } from '../domain/formulario'
import { generarPasswordProvisional } from '../domain/password'
import { useCrearBarbero } from '../hooks'
import type { BarberoAdmin } from '../types'
import { SecretoCopiable } from './SecretoCopiable'
import { useCopiar } from './useCopiar'

const CAMPOS_INICIALES: EntradaBarbero = {
  nombres: '',
  apellidos: '',
  nombreBarberia: '',
  username: '',
  correo: '',
  password: '',
}

type Tocados = Partial<Record<keyof EntradaBarbero, boolean>>

const SIN_TOCAR: Tocados = {}

export interface SheetNuevoBarberoProps {
  onCerrar: () => void
}

/**
 * Sheet "Nuevo barbero" y, tras crear, la entrega de datos de una sola vez.
 *
 * La contraseña y el código viven solo en el estado de este componente: se
 * monta al abrir y se desmonta al cerrar, así que los secretos se descartan.
 * Nunca se escriben en la caché de consultas, ni en el almacenamiento, ni en la
 * URL.
 */
export function SheetNuevoBarbero({ onCerrar }: SheetNuevoBarberoProps) {
  const { mostrarToast } = useToast()
  const copiar = useCopiar()
  const crear = useCrearBarbero()

  const [campos, setCampos] = useState<EntradaBarbero>(CAMPOS_INICIALES)
  const [tocado, setTocado] = useState<Tocados>(SIN_TOCAR)
  const [error, setError] = useState<string | null>(null)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [creado, setCreado] = useState<BarberoAdmin | null>(null)

  const validacion = validarFormularioBarbero(campos)
  const pendiente = crear.isPending

  function actualizar(campo: keyof EntradaBarbero, valor: string) {
    setCampos((actual) => ({ ...actual, [campo]: valor }))
    setError(null)
  }

  function marcarTocado(campo: keyof EntradaBarbero) {
    setTocado((actual) => ({ ...actual, [campo]: true }))
  }

  function errorDe(campo: keyof EntradaBarbero): string | undefined {
    if (!tocado[campo] && campos[campo].length === 0) return undefined
    return validacion.errores[campo]
  }

  function generar(): void {
    actualizar('password', generarPasswordProvisional())
    setMostrarPassword(true)
  }

  function guardar(): void {
    if (pendiente) return

    if (!validacion.valido || !validacion.cuerpo) {
      setTocado({
        nombres: true,
        apellidos: true,
        nombreBarberia: true,
        username: true,
        correo: true,
        password: true,
      })
      return
    }

    setError(null)
    crear.mutate(validacion.cuerpo, {
      onSuccess: (barbero) => {
        setCreado(barbero)
        mostrarToast({ mensaje: 'Barbero creado', duracionMs: 4000 })
      },
      onError: (fallo) => setError(textoDeErrorAdmin(fallo)),
    })
  }

  function entregar(): void {
    if (!creado) return

    void copiar(
      textoEntrega({
        nombres: creado.nombres,
        apellidos: creado.apellidos,
        username: creado.username,
        password: campos.password,
        codigoUnico: creado.codigoUnico,
        linkReservas: linkReservasDe(creado),
      }),
      'Mensaje copiado',
    )
  }

  return (
    <Sheet
      abierto
      onCerrar={onCerrar}
      titulo={creado ? 'Entrega estos datos' : 'Nuevo barbero'}
      descripcion={
        creado
          ? undefined
          : 'Se crea con estado activo y con un código de reservas generado por el servidor.'
      }
    >
      {creado ? (
        <div aria-live="polite" className="flex flex-col gap-3">
          <p className="type-form font-medium text-text">Entrega estos datos al barbero</p>

          <SecretoCopiable etiqueta="Usuario" valor={creado.username} />
          <SecretoCopiable etiqueta="Contraseña" valor={campos.password} />
          <SecretoCopiable etiqueta="Código" valor={creado.codigoUnico} />
          <SecretoCopiable etiqueta="Link de reservas" valor={linkReservasDe(creado)} />

          <p className="type-helper">
            La contraseña solo se muestra ahora. Guárdala antes de cerrar.
          </p>

          <Button onClick={entregar} className="w-full">
            Copiar todo
          </Button>
          <Button variante="ghost" onClick={onCerrar} className="w-full">
            Listo
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Input
            etiqueta="Nombre"
            value={campos.nombres}
            onChange={(evento) => actualizar('nombres', evento.target.value)}
            onBlur={() => marcarTocado('nombres')}
            error={errorDe('nombres')}
            autoComplete="given-name"
            placeholder="Ej. Ana"
          />

          <Input
            etiqueta="Apellidos"
            value={campos.apellidos}
            onChange={(evento) => actualizar('apellidos', evento.target.value)}
            onBlur={() => marcarTocado('apellidos')}
            error={errorDe('apellidos')}
            autoComplete="family-name"
            placeholder="Ej. Paz"
          />

          <Input
            etiqueta="Barbería"
            ayuda="Opcional"
            value={campos.nombreBarberia}
            onChange={(evento) => actualizar('nombreBarberia', evento.target.value)}
            onBlur={() => marcarTocado('nombreBarberia')}
            error={errorDe('nombreBarberia')}
            autoComplete="organization"
            placeholder="Ej. Ana Barber"
          />

          <Input
            etiqueta="Usuario"
            ayuda="Minúsculas, números, punto, guion y guion bajo"
            value={campos.username}
            onChange={(evento) => actualizar('username', evento.target.value)}
            onBlur={() => marcarTocado('username')}
            error={errorDe('username')}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Ej. ana.paz"
          />

          <Input
            etiqueta="Correo"
            type="email"
            value={campos.correo}
            onChange={(evento) => actualizar('correo', evento.target.value)}
            onBlur={() => marcarTocado('correo')}
            error={errorDe('correo')}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Ej. ana@example.com"
          />

          <Input
            id="nuevo-barbero-password"
            etiqueta="Contraseña"
            ayuda="Entre 8 y 72 caracteres"
            type={mostrarPassword ? 'text' : 'password'}
            value={campos.password}
            onChange={(evento) => actualizar('password', evento.target.value)}
            onBlur={() => marcarTocado('password')}
            error={errorDe('password')}
            autoComplete="new-password"
            accionDerecha={
              <button
                type="button"
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={mostrarPassword}
                aria-controls="nuevo-barbero-password"
                onMouseDown={(evento) => evento.preventDefault()}
                onClick={() => setMostrarPassword((visible) => !visible)}
                className="type-helper inline-flex h-[var(--height-button-compact)] items-center justify-center rounded-[var(--radius-button-card)] px-2 text-secondary hover:bg-white-5 hover:text-text"
              >
                {mostrarPassword ? 'Ocultar' : 'Ver'}
              </button>
            }
          />

          <Button variante="ghost" onClick={generar} className="w-full">
            Generar contraseña
          </Button>

          {error && (
            <p role="alert" className="type-helper text-red">
              {error}
            </p>
          )}

          <Button
            onClick={guardar}
            disabled={!validacion.valido || pendiente}
            aria-disabled={!validacion.valido || pendiente || undefined}
            cargando={pendiente}
            className="w-full"
          >
            Crear barbero
          </Button>

          <Button
            variante="ghost"
            onClick={onCerrar}
            disabled={pendiente}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      )}
    </Sheet>
  )
}
