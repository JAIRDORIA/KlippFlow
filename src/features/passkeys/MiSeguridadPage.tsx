import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Chip } from '@/shared/ui/Chip'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { Logo } from '@/shared/ui/Logo'
import { Sheet } from '@/shared/ui/Sheet'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useToast } from '@/shared/ui/toast-context'
import type { PasskeyCliente } from './types'
import {
  fechaHoraPasskey,
  mapearErrorPasskey,
  nombreSugeridoDispositivo,
  soportaPasskeys,
  tipoDispositivoLegible,
} from './domain/passkeys'
import {
  useAutenticadorPlataforma,
  useEliminarPasskey,
  usePasskeysCliente,
  useRegistrarPasskey,
} from './hooks'

export function MiSeguridadPage() {
  useTituloPagina()
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const { mostrarToast } = useToast()
  const passkeys = usePasskeysCliente()
  const plataforma = useAutenticadorPlataforma()
  const registrar = useRegistrarPasskey()
  const eliminar = useEliminarPasskey()

  const [sheetCrear, setSheetCrear] = useState(false)
  const [nombre, setNombre] = useState('')
  const [errorCrear, setErrorCrear] = useState<string | null>(null)
  const [aBorrar, setABorrar] = useState<PasskeyCliente | null>(null)
  const [errorBorrar, setErrorBorrar] = useState<string | null>(null)

  if (!usuario || usuario.tipo !== 'cliente') {
    if (usuario?.tipo === 'barbero') return <Navigate to="/app" replace />
    return <Navigate to="/login?volver=%2Fmi%2Fseguridad" replace />
  }

  const lista = passkeys.data ?? []
  const soportado = soportaPasskeys()
  const puedeAgregar = soportado && plataforma === true

  function abrirCrear() {
    setNombre(nombreSugeridoDispositivo())
    setErrorCrear(null)
    setSheetCrear(true)
  }

  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!nombre.trim() || registrar.isPending) return

    setErrorCrear(null)
    registrar.mutate(
      { nombre },
      {
        onSuccess: () => {
          setSheetCrear(false)
          mostrarToast({
            mensaje: 'Listo, la próxima vez entra con tu huella o PIN',
          })
        },
        onError: (fallo) => {
          const mapeado = mapearErrorPasskey(fallo, 'registro')
          if (mapeado.silencioso) setSheetCrear(false)
          else setErrorCrear(mapeado.mensaje)
        },
      },
    )
  }

  function borrar() {
    if (!aBorrar || eliminar.isPending) return

    setErrorBorrar(null)
    eliminar.mutate(aBorrar.id, {
      onSuccess: () => {
        setABorrar(null)
        mostrarToast({ mensaje: 'Passkey borrada.' })
      },
      onError: (fallo) => {
        setErrorBorrar(mapearErrorPasskey(fallo, 'registro').mensaje)
      },
    })
  }

  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-8">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <Logo tamano="sm" />
            <Button
              variante="ghost"
              tamano="compacto"
              onClick={() => navegar('/mi')}
            >
              Volver
            </Button>
          </div>
          <div>
            <p className="type-eyebrow">TU CUENTA</p>
            <h1 className="type-public-title">Seguridad</h1>
            <p className="type-form mt-3 text-secondary">
              Gestiona las passkeys y la contraseña de tu cuenta de cliente.
            </p>
          </div>
        </header>

        <section aria-labelledby="tus-passkeys" className="flex flex-col gap-4">
          <h2 id="tus-passkeys" className="type-eyebrow">
            TUS PASSKEYS
          </h2>

          {passkeys.isPending ? (
            <div className="flex flex-col gap-3" aria-hidden="true">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : passkeys.isError ? (
            <EmptyState
              titulo="No pudimos cargar tus passkeys"
              descripcion="Revisa tu conexión e inténtalo de nuevo."
              accion={
                <Button
                  tamano="compacto"
                  onClick={() => void passkeys.refetch()}
                >
                  Reintentar
                </Button>
              }
            />
          ) : lista.length === 0 ? (
            <EmptyState
              titulo="Aún no tienes passkeys"
              descripcion="Crea una para entrar con tu huella, rostro o PIN sin escribir tu contraseña."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {lista.map((passkey) => (
                <li key={passkey.id}>
                  <Card className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="type-card-title break-words">
                        {passkey.nombre}
                      </p>
                      <Chip variante={passkey.respaldada ? 'verde' : 'neutro'}>
                        {passkey.respaldada ? 'Sincronizada' : 'Este dispositivo'}
                      </Chip>
                    </div>
                    <p className="type-small text-secondary">
                      {tipoDispositivoLegible(passkey.tipoDispositivo)}
                    </p>
                    <p className="type-helper">
                      Creada el {fechaHoraPasskey(passkey.creadaEn)}
                    </p>
                    <p className="type-helper">
                      Último uso{' '}
                      {passkey.ultimoUsoEn
                        ? `el ${fechaHoraPasskey(passkey.ultimoUsoEn)}`
                        : '—'}
                    </p>
                    <Button
                      variante="ghost"
                      tamano="compacto"
                      onClick={() => {
                        setErrorBorrar(null)
                        setABorrar(passkey)
                      }}
                    >
                      Borrar
                    </Button>
                  </Card>
                </li>
              ))}
            </ul>
          )}

          <Button
            onClick={abrirCrear}
            disabled={!puedeAgregar}
            aria-disabled={!puedeAgregar || undefined}
            className="w-full"
          >
            Agregar passkey de este dispositivo
          </Button>

          {!soportado ? (
            <p className="type-helper" role="status">
              Este dispositivo no admite passkeys.
            </p>
          ) : plataforma === false ? (
            <p className="type-helper" role="status">
              Este dispositivo no tiene un autenticador de plataforma
              disponible.
            </p>
          ) : null}
        </section>

        <Card className="flex flex-col gap-3">
          <p className="type-card-title">Contraseña</p>
          <p className="type-small text-secondary">
            También puedes entrar con tu usuario y contraseña desde cualquier
            dispositivo.
          </p>
          <Link
            to="/mi/nueva-contrasena"
            className="type-form inline-flex min-h-[var(--height-button)] w-full items-center justify-center rounded-[var(--radius-button)] border border-line px-[var(--padding-button-x)] font-semibold text-text"
          >
            Cambiar contraseña
          </Link>
        </Card>
      </div>

      <Sheet
        abierto={sheetCrear}
        onCerrar={() => setSheetCrear(false)}
        titulo="Agregar passkey"
        descripcion="Se creará en este dispositivo."
        pie={
          <Button
            type="submit"
            form="form-agregar-passkey"
            className="w-full"
            disabled={!nombre.trim() || registrar.isPending}
            cargando={registrar.isPending}
          >
            Agregar passkey
          </Button>
        }
      >
        <form
          id="form-agregar-passkey"
          onSubmit={guardar}
          className="flex flex-col gap-4"
          noValidate
        >
          <Input
            etiqueta="Nombre"
            name="nombre-passkey"
            value={nombre}
            onChange={(evento) => {
              setNombre(evento.target.value)
              setErrorCrear(null)
            }}
            error={errorCrear ?? undefined}
            ayuda="Así la reconocerás en la lista."
            maxLength={60}
            autoComplete="off"
          />
        </form>
      </Sheet>

      <Sheet
        abierto={aBorrar !== null}
        onCerrar={() => {
          setABorrar(null)
          setErrorBorrar(null)
        }}
        titulo="Borrar passkey"
        descripcion={
          aBorrar ? `Se borrará “${aBorrar.nombre}”.` : undefined
        }
        pie={
          <div className="flex flex-col gap-2">
            <Button
              variante="danger"
              onClick={borrar}
              disabled={eliminar.isPending}
              cargando={eliminar.isPending}
              className="w-full"
            >
              Borrar passkey
            </Button>
            <Button
              variante="ghost"
              onClick={() => {
                setABorrar(null)
                setErrorBorrar(null)
              }}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="type-form">
            ¿Seguro que quieres borrar esta passkey?
          </p>
          <p className="type-helper">
            No podrás usarla para entrar desde este dispositivo.
          </p>
          <div aria-live="polite">
            {errorBorrar && (
              <p role="alert" className="type-helper text-red">
                {errorBorrar}
              </p>
            )}
          </div>
        </div>
      </Sheet>
    </main>
  )
}
