import { useState, type FormEvent } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
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
  MENSAJE_CORREO_SIN_VERIFICAR,
  mapearErrorCodigo,
  mapearErrorSolicitudCodigo,
} from './domain/errores'
import {
  normalizarCorreoRegistro,
  validarCodigo,
  validarCorreoRegistro,
} from './domain/validadores'
import { useReenviarCodigoVerificacion, useVerificarCorreo } from './hooks'
import { formatearCuentaRegresiva, useCooldown } from './useCooldown'
import { leerEstadoVerificacion } from './verificacion'

const CLASE_AVISO =
  'type-small rounded-[var(--radius-warning)] border p-[var(--space-warning)]'

export function VerificarCorreoPage() {
  const { estaAutenticado, tipo } = useAuth()
  useTituloPagina()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [parametros] = useSearchParams()
  const volver = volverSeguro(parametros.get('volver'))
  const estado = leerEstadoVerificacion(ubicacion.state)

  // Sin correo en el estado (login con username o acceso directo) se pide.
  const [correoFijo] = useState(estado.correo ?? null)
  const [correo, setCorreo] = useState(estado.correo ?? '')
  const [codigo, setCodigo] = useState('')
  const [tocadoCorreo, setTocadoCorreo] = useState(false)
  const [tocadoCodigo, setTocadoCodigo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(
    estado.mensaje ?? (estado.desdeLogin ? MENSAJE_CORREO_SIN_VERIFICAR : null),
  )

  const verificar = useVerificarCorreo()
  const reenviar = useReenviarCodigoVerificacion()
  const cooldown = useCooldown(60)

  if (estaAutenticado && !verificar.isSuccess) {
    return <Navigate to={rutaInicialPorRol(tipo)} replace />
  }

  const errorCorreo = validarCorreoRegistro(correo)
  const errorCodigo = validarCodigo(codigo)
  const pendiente = verificar.isPending || reenviar.isPending
  const puedeVerificar = !errorCorreo && !errorCodigo && !pendiente
  const puedeReenviar = !errorCorreo && !pendiente && !cooldown.activo

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setTocadoCorreo(true)
    setTocadoCodigo(true)
    if (!puedeVerificar) return
    setError(null)
    verificar.mutate(
      { correo: normalizarCorreoRegistro(correo), codigo },
      {
        onSuccess: () => navegar(volver ?? '/mi', { replace: true }),
        onError: (fallo) => setError(mapearErrorCodigo(fallo)),
      },
    )
  }

  function pedirOtroCodigo() {
    setTocadoCorreo(true)
    if (!puedeReenviar) return
    setError(null)
    reenviar.mutate(normalizarCorreoRegistro(correo), {
      onSuccess: (respuesta) => {
        // El código anterior quedó invalidado.
        setCodigo('')
        setInfo(respuesta.mensaje)
        cooldown.iniciar()
      },
      onError: (fallo) => setError(mapearErrorSolicitudCodigo(fallo)),
    })
  }

  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-8">
        <header className="flex flex-col gap-4">
          <Logo tamano="sm" />
          <div>
            <h1 className="type-public-title">Verifica tu correo</h1>
            <p className="type-form mt-3 text-secondary">
              {correoFijo ? (
                <>
                  Escribe el código de 6 dígitos que enviamos a{' '}
                  <strong className="text-text">{correoFijo}</strong>. Vence en
                  15 minutos.
                </>
              ) : (
                'Escribe el correo de tu cuenta y el código de 6 dígitos que te enviamos. Vence en 15 minutos.'
              )}
            </p>
          </div>
        </header>

        <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
          {!correoFijo && (
            <Input
              etiqueta="Correo electrónico"
              name="correo"
              type="email"
              value={correo}
              onChange={(evento) => {
                setCorreo(evento.target.value)
                setError(null)
              }}
              onBlur={() => setTocadoCorreo(true)}
              error={tocadoCorreo ? errorCorreo ?? undefined : undefined}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={255}
              placeholder="tu@correo.com"
            />
          )}

          <InputCodigo
            valor={codigo}
            onCambio={(valor) => {
              setCodigo(valor)
              setError(null)
            }}
            onBlur={() => setTocadoCodigo(true)}
            error={
              tocadoCodigo && codigo.length > 0 ? errorCodigo ?? undefined : undefined
            }
            autoFocus={Boolean(correoFijo)}
          />

          {info && !error && (
            <p
              role="status"
              className={cn(CLASE_AVISO, 'border-green-40 bg-green-10 text-green')}
            >
              {info}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className={cn(CLASE_AVISO, 'border-red-30 bg-red-10 text-red')}
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="mt-2 w-full"
            disabled={!puedeVerificar}
            cargando={verificar.isPending}
          >
            Verificar
          </Button>

          <Button
            type="button"
            variante="ghost"
            className="w-full border border-line bg-card"
            onClick={pedirOtroCodigo}
            disabled={!puedeReenviar}
            cargando={reenviar.isPending}
          >
            {cooldown.activo
              ? `Reenviar en ${formatearCuentaRegresiva(cooldown.restantes)}`
              : 'Reenviar código'}
          </Button>

          <p className="type-helper text-center">
            Máximo 5 intentos por código. Pedir uno nuevo invalida el anterior.
          </p>

          <Link
            to="/login"
            className="type-small inline-flex min-h-[var(--height-button-compact)] items-center justify-center text-secondary underline underline-offset-2 hover:text-text"
          >
            Volver a entrar
          </Link>
        </form>

        <footer className="text-center">
          <EnlacePrivacidad />
        </footer>
      </div>
    </main>
  )
}
