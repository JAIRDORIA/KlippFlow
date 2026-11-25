import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import { useAuth } from '@/features/auth/useAuth'
import { EnlacePrivacidad } from '@/features/legal/components/EnlacePrivacidad'
import { cn } from '@/shared/lib/cn'
import { rutaInicialPorRol, volverSeguro } from '@/shared/lib/rutas'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Logo } from '@/shared/ui/Logo'
import { InputCodigo } from './components/InputCodigo'
import {
  mapearErrorCodigo,
  mapearErrorSolicitudCodigo,
} from './domain/errores'
import {
  normalizarIdentificador,
  validarCodigo,
  validarContrasena,
  validarIdentificador,
} from './domain/validadores'
import { useRestablecerPassword, useSolicitarRecuperacion } from './hooks'
import { formatearCuentaRegresiva, useCooldown } from './useCooldown'

const CLASE_AVISO =
  'type-small rounded-[var(--radius-warning)] border p-[var(--space-warning)]'

const CLASE_ENLACE =
  'type-small inline-flex min-h-[var(--height-button-compact)] items-center justify-center text-secondary underline underline-offset-2 hover:text-text'

/** Motivo que lee el login (`avisoPorMotivo`) para avisar que la contraseña cambió. */
const MOTIVO_CONTRASENA_RESTABLECIDA = 'contrasena-restablecida'

function conVolver(ruta: string, volver: string | null, extra?: Record<string, string>) {
  const parametros = new URLSearchParams(extra)
  if (volver) parametros.set('volver', volver)
  const consulta = parametros.toString()
  return consulta ? `${ruta}?${consulta}` : ruta
}

/**
 * Recuperación con código de 6 dígitos:
 * 1. Usuario o correo → `POST /auth/cliente/recuperar-password` (respuesta genérica).
 * 2. Código + nueva contraseña → `POST /auth/cliente/restablecer-password`.
 * El identificador vive solo en el estado del componente.
 */
export function RecuperarPasswordPage() {
  const { estaAutenticado, tipo } = useAuth()
  useTituloPagina()
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const volver = volverSeguro(parametros.get('volver'))

  const [paso, setPaso] = useState<'identificador' | 'codigo'>('identificador')
  const [identificador, setIdentificador] = useState('')
  const [codigo, setCodigo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [tocadoIdentificador, setTocadoIdentificador] = useState(false)
  const [tocadoCodigo, setTocadoCodigo] = useState(false)
  const [tocadaContrasena, setTocadaContrasena] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const solicitar = useSolicitarRecuperacion()
  const restablecer = useRestablecerPassword()
  const cooldown = useCooldown(60)

  if (estaAutenticado) {
    return <Navigate to={rutaInicialPorRol(tipo)} replace />
  }

  const identificadorNormalizado = normalizarIdentificador(identificador)
  const errorIdentificador = validarIdentificador(identificador)
  const errorCodigo = validarCodigo(codigo)
  // Si escribió un correo no conocemos el username; el backend valida esa regla.
  const usernameParaValidar = identificadorNormalizado.includes('@')
    ? ''
    : identificadorNormalizado
  const errorContrasena = validarContrasena(contrasena, usernameParaValidar)
  const pendiente = solicitar.isPending || restablecer.isPending

  function pedirCodigo(alTerminar?: () => void) {
    if (errorIdentificador || pendiente) return
    setError(null)
    solicitar.mutate(identificadorNormalizado, {
      onSuccess: (respuesta) => {
        setInfo(respuesta.mensaje)
        setCodigo('')
        cooldown.iniciar()
        alTerminar?.()
      },
      onError: (fallo) => setError(mapearErrorSolicitudCodigo(fallo)),
    })
  }

  function enviarIdentificador(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setTocadoIdentificador(true)
    pedirCodigo(() => setPaso('codigo'))
  }

  function enviarNuevaContrasena(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setTocadoCodigo(true)
    setTocadaContrasena(true)
    if (errorCodigo || errorContrasena || pendiente) return
    setError(null)
    restablecer.mutate(
      {
        identificador: identificadorNormalizado,
        codigo,
        nuevaContrasena: contrasena,
      },
      {
        onSuccess: () => {
          navegar(
            conVolver('/login', volver, { motivo: MOTIVO_CONTRASENA_RESTABLECIDA }),
            { replace: true },
          )
        },
        onError: (fallo) => setError(mapearErrorCodigo(fallo)),
      },
    )
  }

  function cambiarIdentificador() {
    setPaso('identificador')
    setCodigo('')
    setContrasena('')
    setTocadoCodigo(false)
    setTocadaContrasena(false)
    setInfo(null)
    setError(null)
  }

  const alertaInfo = info && !error && (
    <p
      role="status"
      className={cn(CLASE_AVISO, 'border-green-40 bg-green-10 text-green')}
    >
      {info}
    </p>
  )

  const alertaError = error && (
    <p role="alert" className={cn(CLASE_AVISO, 'border-red-30 bg-red-10 text-red')}>
      {error}
    </p>
  )

  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-8">
        <header className="flex flex-col gap-4">
          <Logo tamano="sm" />
          <div>
            <h1 className="type-public-title">Recupera tu contraseña</h1>
            <p className="type-form mt-3 text-secondary">
              {paso === 'identificador'
                ? 'Escribe tu usuario o tu correo. Si la cuenta tiene un correo verificado, te enviaremos un código de 6 dígitos.'
                : 'Escribe el código que te enviamos y tu nueva contraseña. El código vence en 15 minutos.'}
            </p>
          </div>
        </header>

        {paso === 'identificador' ? (
          <form
            onSubmit={enviarIdentificador}
            className="flex flex-col gap-5"
            noValidate
          >
            <Input
              etiqueta="Usuario o correo"
              name="identificador"
              value={identificador}
              onChange={(evento) => {
                setIdentificador(evento.target.value)
                setError(null)
              }}
              onBlur={() => setTocadoIdentificador(true)}
              error={
                tocadoIdentificador ? errorIdentificador ?? undefined : undefined
              }
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={255}
              placeholder="tu.usuario o tu@correo.com"
            />

            {alertaError}

            <Button
              type="submit"
              className="mt-2 w-full"
              disabled={Boolean(errorIdentificador) || pendiente}
              cargando={solicitar.isPending}
            >
              Enviar código
            </Button>
          </form>
        ) : (
          <form
            onSubmit={enviarNuevaContrasena}
            className="flex flex-col gap-5"
            noValidate
          >
            <p className="type-small text-secondary">
              Cuenta: <strong className="text-text">{identificadorNormalizado}</strong>{' '}
              <button
                type="button"
                onClick={cambiarIdentificador}
                className="underline underline-offset-2 hover:text-text"
              >
                Cambiar
              </button>
            </p>

            <InputCodigo
              valor={codigo}
              onCambio={(valor) => {
                setCodigo(valor)
                setError(null)
              }}
              onBlur={() => setTocadoCodigo(true)}
              error={
                tocadoCodigo && codigo.length > 0
                  ? errorCodigo ?? undefined
                  : undefined
              }
              autoFocus
            />

            <Input
              id="recuperar-contrasena"
              etiqueta="Nueva contraseña"
              name="nuevaContrasena"
              type={mostrarContrasena ? 'text' : 'password'}
              value={contrasena}
              onChange={(evento) => {
                setContrasena(evento.target.value)
                setError(null)
              }}
              onBlur={() => setTocadaContrasena(true)}
              error={
                tocadaContrasena && contrasena.length > 0
                  ? errorContrasena ?? undefined
                  : undefined
              }
              ayuda="Entre 8 y 72 caracteres y distinta del usuario."
              autoComplete="new-password"
              placeholder="Tu nueva contraseña"
              accionDerecha={
                <button
                  type="button"
                  aria-label={
                    mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  aria-pressed={mostrarContrasena}
                  aria-controls="recuperar-contrasena"
                  onMouseDown={(evento) => evento.preventDefault()}
                  onClick={() => setMostrarContrasena((visible) => !visible)}
                  className="inline-flex size-[var(--height-button-compact)] items-center justify-center rounded-[var(--radius-button-card)] text-secondary transition-colors hover:bg-white-5 hover:text-text"
                >
                  {mostrarContrasena ? (
                    <EyeOff aria-hidden="true" size={18} strokeWidth={1.6} />
                  ) : (
                    <Eye aria-hidden="true" size={18} strokeWidth={1.6} />
                  )}
                </button>
              }
            />

            {alertaInfo}
            {alertaError}

            <Button
              type="submit"
              className="mt-2 w-full"
              disabled={Boolean(errorCodigo || errorContrasena) || pendiente}
              cargando={restablecer.isPending}
            >
              Guardar contraseña
            </Button>

            <Button
              type="button"
              variante="ghost"
              className="w-full border border-line bg-card"
              onClick={() => pedirCodigo()}
              disabled={pendiente || cooldown.activo}
              cargando={solicitar.isPending}
            >
              {cooldown.activo
                ? `Reenviar en ${formatearCuentaRegresiva(cooldown.restantes)}`
                : 'Reenviar código'}
            </Button>

            <p className="type-helper text-center">
              Máximo 5 intentos por código. Pedir uno nuevo invalida el anterior.
            </p>
          </form>
        )}

        <div className="flex flex-col items-center gap-1">
          <Link
            to={conVolver('/login', volver, { recuperar: '1' })}
            className={CLASE_ENLACE}
          >
            ¿Te registraste con Google? Entra con Google
          </Link>
          <Link to={conVolver('/login', volver)} className={CLASE_ENLACE}>
            Volver a entrar
          </Link>
        </div>

        <footer className="text-center">
          <EnlacePrivacidad />
        </footer>
      </div>
    </main>
  )
}
