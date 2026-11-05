import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import { useAuth } from '@/features/auth/useAuth'
import { requiereContrasenaActual } from '@/features/auth/sesion'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Logo } from '@/shared/ui/Logo'
import { useToast } from '@/shared/ui/toast-context'
import { mapearErrorContrasena } from './domain/errores'
import { validarContrasena } from './domain/validadores'
import { useCambiarContrasena } from './hooks'

export function NuevaContrasenaPage() {
  const { usuario, sesion, metodo } = useAuth()
  useTituloPagina()
  const navegar = useNavigate()
  const { mostrarToast } = useToast()
  const [contrasena, setContrasena] = useState('')
  const [actual, setActual] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [mostrarActual, setMostrarActual] = useState(false)
  const [tocada, setTocada] = useState(false)
  const [tocadaActual, setTocadaActual] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const mutacion = useCambiarContrasena()

  if (!usuario || usuario.tipo !== 'cliente') {
    if (usuario?.tipo === 'barbero') return <Navigate to="/app" replace />
    return (
      <Navigate
        to="/login?volver=%2Fmi%2Fnueva-contrasena"
        replace
      />
    )
  }

  const pideActual = sesion ? requiereContrasenaActual(sesion.token) : true
  const esPasskey = metodo === 'passkey'
  const errorCampo = validarContrasena(contrasena, usuario.username)
  const errorActual =
    pideActual && actual.length === 0
      ? 'Escribe tu contraseña actual.'
      : null
  const valido = contrasena.length > 0 && !errorCampo && !errorActual

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!valido || mutacion.isPending) return
    setErrorEnvio(null)
    mutacion.mutate(
      {
        nuevaContrasena: contrasena,
        ...(pideActual ? { contrasenaActual: actual } : {}),
      },
      {
        onSuccess: () => {
          mostrarToast({ mensaje: 'Contraseña actualizada.' })
          navegar('/mi', { replace: true })
        },
        onError: (fallo) => setErrorEnvio(mapearErrorContrasena(fallo)),
      },
    )
  }

  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-8">
        <header className="flex flex-col gap-4">
          <Logo tamano="sm" />
          <h1 className="type-public-title">Nueva contraseña</h1>
          <p className="type-form text-secondary">
            {esPasskey
              ? 'Define una contraseña de respaldo para cuando no puedas usar tu passkey.'
              : 'Crea una contraseña para entrar sin depender de Google.'}
          </p>
        </header>

        <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
          {pideActual && (
            <Input
              id="contrasena-actual"
              etiqueta="Contraseña actual"
              name="contrasenaActual"
              type={mostrarActual ? 'text' : 'password'}
              value={actual}
              onChange={(evento) => {
                setActual(evento.target.value)
                setErrorEnvio(null)
              }}
              onBlur={() => setTocadaActual(true)}
              error={
                tocadaActual && errorActual ? errorActual : undefined
              }
              autoComplete="current-password"
              placeholder="Tu contraseña actual"
              accionDerecha={
                <button
                  type="button"
                  aria-label={
                    mostrarActual ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  aria-pressed={mostrarActual}
                  aria-controls="contrasena-actual"
                  onMouseDown={(evento) => evento.preventDefault()}
                  onClick={() => setMostrarActual((visible) => !visible)}
                  className="inline-flex size-[var(--height-button-compact)] items-center justify-center rounded-[var(--radius-button-card)] text-secondary transition-colors hover:bg-white-5 hover:text-text"
                >
                  {mostrarActual ? (
                    <EyeOff aria-hidden="true" size={18} strokeWidth={1.6} />
                  ) : (
                    <Eye aria-hidden="true" size={18} strokeWidth={1.6} />
                  )}
                </button>
              }
            />
          )}

          <Input
            id="nueva-contrasena"
            etiqueta="Nueva contraseña"
            name="nuevaContrasena"
            type={mostrar ? 'text' : 'password'}
            value={contrasena}
            onChange={(evento) => {
              setContrasena(evento.target.value)
              setErrorEnvio(null)
            }}
            onBlur={() => setTocada(true)}
            error={tocada ? errorCampo ?? undefined : undefined}
            ayuda="Entre 8 y 72 caracteres y distinta del usuario."
            autoComplete="new-password"
            placeholder="Tu nueva contraseña"
            accionDerecha={
              <button
                type="button"
                aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={mostrar}
                aria-controls="nueva-contrasena"
                onMouseDown={(evento) => evento.preventDefault()}
                onClick={() => setMostrar((visible) => !visible)}
                className="inline-flex size-[var(--height-button-compact)] items-center justify-center rounded-[var(--radius-button-card)] text-secondary transition-colors hover:bg-white-5 hover:text-text"
              >
                {mostrar ? (
                  <EyeOff aria-hidden="true" size={18} strokeWidth={1.6} />
                ) : (
                  <Eye aria-hidden="true" size={18} strokeWidth={1.6} />
                )}
              </button>
            }
          />

          {esPasskey && (
            <p className="type-helper">
              ¿Olvidaste tu contraseña actual? Entra con Google desde{' '}
              <Link
                to="/login?recuperar=1"
                className="underline underline-offset-2 hover:text-text"
              >
                /login?recuperar=1
              </Link>
              .
            </p>
          )}

          {!pideActual && metodo === 'google' && (
            <p className="type-helper">
              Tu sesión de Google es reciente; puedes crear la contraseña sin
              escribir la actual.
            </p>
          )}

          {errorEnvio && (
            <p
              role="alert"
              className="type-small rounded-[var(--radius-warning)] border border-red-30 bg-red-10 p-[var(--space-warning)] text-red"
            >
              {errorEnvio}
            </p>
          )}

          <Button
            type="submit"
            className="mt-2 w-full"
            disabled={!valido || mutacion.isPending}
            cargando={mutacion.isPending}
          >
            Guardar contraseña
          </Button>
        </form>
      </div>
    </main>
  )
}
