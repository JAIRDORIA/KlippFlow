import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import { useAuth } from '@/features/auth/useAuth'
import { saludo } from '@/shared/lib/fechas'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { Logo } from '@/shared/ui/Logo'
import { Sheet } from '@/shared/ui/Sheet'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useToast } from '@/shared/ui/toast-context'
import { citasDestacadas } from './domain/citas'
import { mapearErrorAgregarBarbero } from './domain/errores'
import {
  useAgregarBarberoCliente,
  useBarberosCliente,
  useCitasCliente,
  usePerfilCliente,
} from './hooks'
import { AvisoActivarApp } from './components/AvisoActivarApp'
import { EnlacePrivacidad } from '@/features/legal/components/EnlacePrivacidad'
import { AvisoCrearPasskey } from '@/features/passkeys/components/AvisoCrearPasskey'
import { TarjetaCitaCliente } from './components/TarjetaCitaCliente'

export function MiPage() {
  const { usuario, nombre, cerrarSesion } = useAuth()
  useTituloPagina()
  const navegar = useNavigate()
  const { mostrarToast } = useToast()
  const perfil = usePerfilCliente()
  const barberos = useBarberosCliente()
  const citas = useCitasCliente()
  const agregarBarbero = useAgregarBarberoCliente()

  const [menuCuenta, setMenuCuenta] = useState(false)
  const [sheetBarbero, setSheetBarbero] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null)
  const [saliendo, setSaliendo] = useState(false)
  const [errorCuenta, setErrorCuenta] = useState<string | null>(null)

  const cerrarMenu = useCallback(() => setMenuCuenta(false), [])
  const cerrarSheetBarbero = useCallback(() => setSheetBarbero(false), [])

  const destacadas = useMemo(
    () => citasDestacadas(citas.data ?? [], new Date()),
    [citas.data],
  )

  if (!usuario || usuario.tipo !== 'cliente') {
    if (usuario?.tipo === 'barbero') return <Navigate to="/app" replace />
    return <Navigate to="/login?volver=%2Fmi" replace />
  }

  const nombreVisible = perfil.data?.nombre ?? nombre ?? usuario.nombre
  const listaCitas = citas.data ?? []
  const listaBarberos = barberos.data ?? []

  function abrirSheetBarbero() {
    setCodigo('')
    setErrorCodigo(null)
    setSheetBarbero(true)
  }

  function guardarBarbero(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const limpio = codigo.trim().toUpperCase()
    if (!limpio || agregarBarbero.isPending) return

    setErrorCodigo(null)
    agregarBarbero.mutate(limpio, {
      onSuccess: () => {
        setSheetBarbero(false)
        mostrarToast({ mensaje: 'Barbero agregado.' })
      },
      onError: (fallo) => setErrorCodigo(mapearErrorAgregarBarbero(fallo)),
    })
  }

  async function salir() {
    if (saliendo) return
    setSaliendo(true)
    setErrorCuenta(null)
    try {
      await cerrarSesion()
      navegar('/login', { replace: true })
    } catch {
      setErrorCuenta('No pudimos cerrar la sesión. Inténtalo de nuevo.')
      setSaliendo(false)
    }
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
              onClick={() => setMenuCuenta(true)}
            >
              Cuenta
            </Button>
          </div>
          <div>
            <p className="type-eyebrow">{saludo()}</p>
            <h1 className="type-public-title break-words">
              Hola, {nombreVisible}
            </h1>
            <p className="type-form mt-3 text-secondary">
              Aquí tienes tus citas y tus barberos.
            </p>
          </div>
        </header>

        <AvisoActivarApp contexto="mi" clienteId={usuario.id} />

        <AvisoCrearPasskey />

        <section aria-labelledby="mis-citas" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="mis-citas" className="type-eyebrow">
              MIS CITAS
            </h2>
            {listaCitas.length > 0 && (
              <Link
                to="/mi/citas"
                className="type-small inline-flex min-h-[var(--height-button-compact)] items-center text-secondary underline underline-offset-2 hover:text-text"
              >
                Ver todas
              </Link>
            )}
          </div>

          {citas.isPending ? (
            <div className="flex flex-col gap-3" aria-hidden="true">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : citas.isError ? (
            <EmptyState
              titulo="No pudimos cargar tus citas"
              descripcion="Revisa tu conexión e inténtalo de nuevo."
              accion={
                <Button tamano="compacto" onClick={() => void citas.refetch()}>
                  Reintentar
                </Button>
              }
            />
          ) : destacadas.length === 0 ? (
            <EmptyState
              titulo="No tienes citas próximas"
              descripcion="Cuando reserves, aquí verás el estado de tu solicitud."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {destacadas.map((cita) => (
                <li key={cita.id}>
                  <TarjetaCitaCliente cita={cita} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="mis-barberos" className="flex flex-col gap-4">
          <h2 id="mis-barberos" className="type-eyebrow">
            MIS BARBEROS
          </h2>

          {barberos.isPending ? (
            <div className="flex flex-col gap-3" aria-hidden="true">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : barberos.isError ? (
            <EmptyState
              titulo="No pudimos cargar tus barberos"
              descripcion="Inténtalo de nuevo."
              accion={
                <Button
                  tamano="compacto"
                  onClick={() => void barberos.refetch()}
                >
                  Reintentar
                </Button>
              }
            />
          ) : listaBarberos.length === 0 ? (
            <EmptyState titulo="Aún no has reservado con ningún barbero. Abre el link que te dio tu barbero." />
          ) : (
            <ul className="flex flex-col gap-3">
              {listaBarberos.map((barbero) => {
                const titulo = barbero.nombreBarberia
                  ? `${barbero.nombre} · ${barbero.nombreBarberia}`
                  : barbero.nombre

                return (
                  <li key={barbero.codigo}>
                    <Card className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="type-card-title break-words">{titulo}</p>
                        <p className="type-helper">{barbero.codigo}</p>
                      </div>
                      {barbero.reservasDisponibles ? (
                        <Link
                          to={`/b/${encodeURIComponent(barbero.codigo)}`}
                          className="inline-flex h-[var(--height-button-compact)] shrink-0 items-center justify-center rounded-[var(--radius-button-card)] bg-accent px-[var(--padding-button-compact-x)] text-[var(--font-size-small)] font-medium text-ink transition-colors hover:bg-white"
                        >
                          Reservar
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-[var(--height-button-compact)] shrink-0 items-center justify-center rounded-[var(--radius-button-card)] border border-line px-[var(--padding-button-compact-x)] text-[var(--font-size-small)] font-medium text-secondary opacity-[var(--opacity-disabled)]"
                        >
                          No disponible
                        </button>
                      )}
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}

          <Button variante="ghost" onClick={abrirSheetBarbero} className="w-full">
            Agregar barbero con código
          </Button>
        </section>

        <footer className="text-center">
          <EnlacePrivacidad />
        </footer>
      </div>

      <Sheet
        abierto={sheetBarbero}
        onCerrar={cerrarSheetBarbero}
        titulo="Agregar barbero"
        descripcion="Escribe el código que te dio tu barbero."
        pie={
          <Button
            type="submit"
            form="form-agregar-barbero"
            className="w-full"
            disabled={!codigo.trim() || agregarBarbero.isPending}
            cargando={agregarBarbero.isPending}
          >
            Agregar barbero
          </Button>
        }
      >
        <form
          id="form-agregar-barbero"
          onSubmit={guardarBarbero}
          className="flex flex-col gap-4"
          noValidate
        >
          <Input
            etiqueta="Código"
            name="codigo-barbero"
            value={codigo}
            onChange={(evento) => {
              setCodigo(evento.target.value)
              setErrorCodigo(null)
            }}
            error={errorCodigo ?? undefined}
            ayuda="Ejemplo: BARB-0001"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={20}
            placeholder="BARB-0001"
          />
        </form>
      </Sheet>

      <Sheet
        abierto={menuCuenta}
        onCerrar={cerrarMenu}
        titulo="Tu cuenta"
        descripcion="Cuenta de cliente"
      >
        <div className="flex flex-col gap-2">
          <Button
            variante="ghost"
            onClick={() => {
              setMenuCuenta(false)
              navegar('/mi/seguridad')
            }}
            className="w-full"
          >
            Seguridad y passkeys
          </Button>
          <Button
            variante="ghost"
            onClick={() => {
              setMenuCuenta(false)
              navegar('/mi/nueva-contrasena')
            }}
            className="w-full"
          >
            Cambiar contraseña
          </Button>
          <Button
            variante="danger"
            onClick={() => void salir()}
            disabled={saliendo}
            aria-disabled={saliendo || undefined}
            cargando={saliendo}
            className="w-full"
          >
            Cerrar sesión
          </Button>
          {errorCuenta && (
            <p role="alert" className="type-helper text-red">
              {errorCuenta}
            </p>
          )}
        </div>
      </Sheet>
    </main>
  )
}
