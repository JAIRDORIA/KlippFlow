import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import { useAdminAuth } from '@/features/auth/useAdminAuth'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Logo } from '@/shared/ui/Logo'
import { mensajeDeErrorLoginAdmin } from './domain/errores'
import { useAdminLogin } from './hooks'

/**
 * Login del panel (`/admin/login`).
 *
 * Mismo lenguaje visual que el login del barbero, pero con marca propia de
 * administración y sin enlaces a ninguna otra parte de la app.
 */
export function AdminLoginPage() {
  useTituloPagina()
  const { estaAutenticado } = useAdminAuth()
  const navegar = useNavigate()
  const [parametros] = useSearchParams()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutacion = useAdminLogin()
  const aviso =
    parametros.get('motivo') === 'sesion-expirada'
      ? 'Tu sesión de administrador caducó. Entra de nuevo.'
      : null

  const puedeEntrar = username.trim().length > 0 && password.length > 0

  if (estaAutenticado) {
    return <Navigate to="/admin" replace />
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!puedeEntrar || mutacion.isPending) return

    setError(null)
    mutacion.mutate(
      { username: username.trim(), password },
      {
        onSuccess: () => navegar('/admin', { replace: true }),
        onError: (fallo) => setError(mensajeDeErrorLoginAdmin(fallo)),
      },
    )
  }

  return (
    <main className="screen-login flex min-h-[100dvh] flex-col justify-center">

      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute size-[200px] rounded-full bg-white-5 blur-2xl"
          />
          <Logo tamano="lg" decorativo />
        </div>
        <p className="type-eyebrow">SOLO ADMINISTRADOR</p>
        <h1 className="type-brand mt-3">Administración</h1>
        <p className="type-small mt-3 max-w-[320px] text-secondary">
          Panel de KlippFlow. Aquí se crean y administran las cuentas de los
          barberos.
        </p>
      </div>

      <form
        onSubmit={enviar}
        className="mx-auto mt-10 flex w-full max-w-[360px] flex-col gap-5"
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
          placeholder="Tu usuario de administrador"
        />

        <Input
          id="admin-login-password"
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
              aria-controls="admin-login-password"
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
          disabled={!puedeEntrar}
          aria-disabled={!puedeEntrar || undefined}
          cargando={mutacion.isPending}
          className="w-full"
        >
          Entrar
        </Button>
      </form>
    </main>
  )
}
