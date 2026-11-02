import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import {
  almacenDelNavegador,
  decidirOnboarding,
  leerDescarte,
} from '@/features/notificaciones/domain/onboarding'
import {
  detectarDispositivo,
  leerEntornoDispositivo,
  leerPermiso,
} from '@/features/notificaciones/domain/plataforma'
import { ErrorPeticion } from '@/shared/api/client'
import { useTituloPagina } from '@/app/useTituloPagina'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Logo } from '@/shared/ui/Logo'
import { useAuth } from './useAuth'

/** Tras entrar: onboarding de instalación/notificaciones o directo a Hoy. */
function destinoTrasEntrar(): string {
  const deteccion = detectarDispositivo(leerEntornoDispositivo())
  const decision = decidirOnboarding({
    plataforma: deteccion.plataforma,
    standalone: deteccion.standalone,
    permiso: leerPermiso(),
    descartadoEn: leerDescarte(almacenDelNavegador()),
    ahora: new Date(),
  })

  return decision === 'nada' ? '/app/hoy' : '/instalar'
}


function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorPeticion) {
    if (error.status === 401) return 'Usuario o contraseña incorrectos'
    if (error.status === 403) {
      return (
        error.mensaje ||
        'Tu cuenta no está activa. Habla con el administrador de KlippFlow.'
      )
    }
    if (error.status === 429) {
      return 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.'
    }
    if (error.status === 0) return 'No pudimos conectar. Revisa tu internet.'
    if (error.status === 400) return error.mensaje
  }
  return 'Algo salió mal. Inténtalo de nuevo.'
}

function avisoPorMotivo(motivo: string | null): string | null {
  if (motivo === 'sesion-expirada') return 'Tu sesión caducó. Entra de nuevo.'
  if (motivo === 'cuenta-no-activa') {
    return 'Tu cuenta no está activa. Habla con el administrador de KlippFlow.'
  }
  return null
}

export function LoginPage() {
  const { estaAutenticado, login } = useAuth()
  const navegar = useNavigate()
  useTituloPagina()
  const [parametros] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const aviso = avisoPorMotivo(parametros.get('motivo'))
  const puedeEntrar = username.trim().length > 0 && password.length > 0

  const mutacion = useMutation({
    mutationFn: login,
    onSuccess: () => navegar(destinoTrasEntrar(), { replace: true }),
    onError: (fallo) => setError(mensajeDeError(fallo)),
  })

  if (estaAutenticado) {
    return <Navigate to="/app/hoy" replace />
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!puedeEntrar || mutacion.isPending) return
    setError(null)
    mutacion.mutate({ username: username.trim(), password })
  }

  return (
    <main className="screen-login flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-8 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute size-[260px] rounded-full bg-white-5 blur-2xl"
          />
          <Logo tamano="lg" decorativo />
        </div>
        <h1 className="type-brand">KlippFlow</h1>
        <p className="type-form mt-4 max-w-[300px] text-secondary">
          Tus citas, tu caja y tu agenda. Un solo lugar, en tu bolsillo.
        </p>
      </div>

      <form
        onSubmit={enviar}
        className="mx-auto mt-12 flex w-full max-w-[360px] flex-col gap-5"
        noValidate
      >
        <Input
          etiqueta="Usuario"
          name="username"
          value={username}
          onChange={(evento) => {
            setUsername(evento.target.value)
            setError(null)
          }}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Tu usuario"
        />
        <Input
          id="login-password"
          etiqueta="Contraseña"
          name="password"
          type={mostrarPassword ? 'text' : 'password'}
          value={password}
          onChange={(evento) => {
            setPassword(evento.target.value)
            setError(null)
          }}
          autoComplete="current-password"
          placeholder="Tu contraseña"
          accionDerecha={
            <button
              type="button"
              aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={mostrarPassword}
              aria-controls="login-password"
              onMouseDown={(evento) => evento.preventDefault()}
              onClick={() => setMostrarPassword((visible) => !visible)}
              className="inline-flex size-[var(--height-button-compact)] items-center justify-center rounded-[var(--radius-button-card)] text-secondary transition-colors hover:bg-white-5 hover:text-text"
            >
              {mostrarPassword ? (
                <EyeOff aria-hidden="true" size={18} strokeWidth={1.6} />
              ) : (
                <Eye aria-hidden="true" size={18} strokeWidth={1.6} />
              )}
            </button>
          }
        />

        {aviso && (
          <p
            role="status"
            className="type-helper rounded-[var(--radius-warning)] border border-amber-30 bg-amber-10 px-[var(--space-warning)] py-[var(--space-warning)] text-amber"
          >
            {aviso}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="type-helper rounded-[var(--radius-warning)] border border-red-30 bg-red-10 px-[var(--space-warning)] py-[var(--space-warning)] text-red"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="mt-2 w-full"
          disabled={!puedeEntrar}
          cargando={mutacion.isPending}
        >
          Entrar
        </Button>
      </form>

      <p className="type-helper mx-auto mt-10 max-w-[360px] text-center">
        Tu cuenta la crea el administrador de KlippFlow. Si no puedes entrar, tu cuenta
        puede estar suspendida o vencida.
      </p>
    </main>
  )
}
