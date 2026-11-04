import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  Link,
  Navigate,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import {
  mapearErrorGoogle,
  mapearErrorLogin,
} from '@/features/cuentas-cliente/domain/errores'
import {
  useLoginGoogle,
  useLoginUnificado,
} from '@/features/cuentas-cliente/hooks'
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
import { rutaInicialPorRol, volverSeguro } from '@/shared/lib/rutas'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Logo } from '@/shared/ui/Logo'
import { BotonGoogle } from './components/BotonGoogle'
import { useAuth } from './useAuth'

/** Onboarding de instalación/notificaciones del barbero; los clientes van a /mi. */
function destinoTrasEntrarBarbero(): string {
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

function avisoPorMotivo(motivo: string | null): string | null {
  if (motivo === 'sesion-expirada') return 'Tu sesión caducó. Entra de nuevo.'
  if (motivo === 'cuenta-no-activa') {
    return 'Tu cuenta no está activa. Habla con el administrador de KlippFlow.'
  }
  if (motivo === 'google-reiniciar') return 'Vuelve a continuar con Google'
  return null
}

export function LoginPage() {
  const { estaAutenticado, tipo } = useAuth()
  const navegar = useNavigate()
  useTituloPagina()
  const [parametros] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recuperar = parametros.get('recuperar') === '1'
  const volver = volverSeguro(parametros.get('volver'))
  const aviso = avisoPorMotivo(parametros.get('motivo'))
  const puedeEntrar = username.trim().length > 0 && password.length > 0

  const login = useLoginUnificado()
  const google = useLoginGoogle()
  const pendiente = login.isPending || google.isPending

  if (estaAutenticado) {
    return <Navigate to={rutaInicialPorRol(tipo)} replace />
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!puedeEntrar || pendiente) return
    setError(null)
    login.mutate(
      { usuario: username.trim(), contrasena: password },
      {
        onSuccess: (respuesta) => {
          const destino =
            volver ??
            (respuesta.tipo === 'barbero'
              ? destinoTrasEntrarBarbero()
              : rutaInicialPorRol('cliente'))
          navegar(destino, { replace: true })
        },
        onError: (fallo) => setError(mapearErrorLogin(fallo)),
      },
    )
  }

  function entrarConGoogle(idToken: string) {
    if (pendiente) return
    setError(null)
    google.mutate(idToken, {
      onSuccess: (respuesta) => {
        if (respuesta.requiereCompletar) {
          const destino = new URLSearchParams()
          if (volver) destino.set('volver', volver)
          const consulta = destino.toString()
          navegar(
            `/registro/completar${consulta ? `?${consulta}` : ''}`,
            { replace: true },
          )
          return
        }

        if (recuperar) {
          navegar('/mi/nueva-contrasena', { replace: true })
          return
        }

        navegar(volver ?? '/mi', { replace: true })
      },
      onError: (fallo) => setError(mapearErrorGoogle(fallo)),
    })
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

      {recuperar ? (
        <section className="mx-auto mt-12 flex w-full max-w-[360px] flex-col gap-5">
          <h2 className="type-card-title text-center">
            Entra con Google para crear una contraseña nueva
          </h2>

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

          <BotonGoogle
            onCredential={entrarConGoogle}
            deshabilitado={pendiente}
          />
        </section>
      ) : (
        <>
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
                  aria-label={
                    mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
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

            <div className="flex justify-end">
              <Link
                to="/login?recuperar=1"
                className="type-small inline-flex min-h-[var(--height-button-compact)] items-center text-secondary underline underline-offset-2 hover:text-text"
              >
                Olvidé mi contraseña
              </Link>
            </div>

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
              disabled={!puedeEntrar || pendiente}
              cargando={login.isPending}
            >
              Entrar
            </Button>
          </form>

          <div className="mx-auto mt-8 flex w-full max-w-[360px] items-center gap-3">
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
            <span className="type-helper">o</span>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </div>

          <div className="mx-auto mt-5 w-full max-w-[360px]">
            <BotonGoogle
              onCredential={entrarConGoogle}
              deshabilitado={pendiente}
            />
          </div>

          <p className="type-helper mx-auto mt-8 max-w-[360px] text-center">
            Si es tu primera vez, crearás tu cuenta.
          </p>
        </>
      )}
    </main>
  )
}
