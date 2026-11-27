import { Eye, EyeOff, Fingerprint } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  Link,
  Navigate,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import {
  esCorreoSinVerificar,
  mapearErrorGoogle,
  mapearErrorLogin,
} from '@/features/cuentas-cliente/domain/errores'
import {
  useLoginGoogle,
  useLoginUnificado,
} from '@/features/cuentas-cliente/hooks'
import {
  correoDesdeIdentificador,
  rutaVerificacion,
  type EstadoVerificacion,
} from '@/features/cuentas-cliente/verificacion'
import { EnlacePrivacidad } from '@/features/legal/components/EnlacePrivacidad'
import { TextoAceptacionGoogle } from '@/features/legal/components/TextoAceptacionGoogle'
import {
  mapearErrorPasskey,
  soportaPasskeys,
} from '@/features/passkeys/domain/passkeys'
import { leerMarcaPasskey } from '@/features/passkeys/domain/marca'
import { useLoginPasskey } from '@/features/passkeys/hooks'
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
import { cn } from '@/shared/lib/cn'
import { rutaInicialPorRol, volverSeguro } from '@/shared/lib/rutas'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Logo } from '@/shared/ui/Logo'
import { Segmented, type OpcionSegmentada } from '@/shared/ui/Segmented'
import { Sheet } from '@/shared/ui/Sheet'
import { BotonGoogle } from './components/BotonGoogle'
import {
  guardarPestana,
  pestanaInicial,
  type PestanaLogin,
} from './pestanaLogin'
import { useAuth } from './useAuth'

/**
 * Selector de tipo de cuenta. No cambia el endpoint (`POST /auth/login` es
 * unificado): decide qué accesos se ven. El barbero solo entra con el usuario
 * y la contraseña que le da el administrador; el cliente, sobre todo con
 * Google o passkey, pero también puede usar el usuario que creó en /registro.
 */
const PESTANAS: readonly OpcionSegmentada<PestanaLogin>[] = [
  { valor: 'barbero', etiqueta: 'Barbero' },
  { valor: 'cliente', etiqueta: 'Cliente' },
]

const CLASE_AVISO =
  'type-helper rounded-[var(--radius-warning)] border px-[var(--space-warning)] py-[var(--space-warning)]'

const CLASE_ENLACE =
  'type-small inline-flex min-h-[var(--height-button-compact)] items-center justify-center text-secondary underline underline-offset-2 hover:text-text'

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

interface Aviso {
  texto: string
  tono: 'amber' | 'green'
}

function avisoPorMotivo(motivo: string | null): Aviso | null {
  const texto = textoPorMotivo(motivo)
  if (!texto) return null
  return {
    texto,
    tono: motivo === 'contrasena-restablecida' ? 'green' : 'amber',
  }
}

function textoPorMotivo(motivo: string | null): string | null {
  if (motivo === 'contrasena-restablecida') {
    return 'Contraseña actualizada. Entra con tu nueva contraseña.'
  }
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
  const recuperar = parametros.get('recuperar') === '1'
  const volver = volverSeguro(parametros.get('volver'))
  const aviso = avisoPorMotivo(parametros.get('motivo'))

  // El destino manda: /dashboard y /app/* abren en "Barbero"; una reserva o
  // una ruta de cliente, en "Cliente". Sin `volver`, se recuerda el dispositivo.
  const [pestana, setPestana] = useState<PestanaLogin>(() =>
    pestanaInicial(volver),
  )
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorPasskey, setErrorPasskey] = useState<string | null>(null)
  const [passkeySinVerificar, setPasskeySinVerificar] = useState(false)
  const [marcaPasskey, setMarcaPasskey] = useState(() => leerMarcaPasskey())
  const [ayudaAbierta, setAyudaAbierta] = useState(false)

  const puedeEntrar = username.trim().length > 0 && password.length > 0
  const soporta = soportaPasskeys()

  const consultaRegistro = new URLSearchParams()
  if (volver) consultaRegistro.set('volver', volver)
  const destinoRegistro = `/registro${
    consultaRegistro.toString() ? `?${consultaRegistro.toString()}` : ''
  }`

  const consultaRecuperar = new URLSearchParams()
  if (volver) consultaRecuperar.set('volver', volver)
  const destinoRecuperar = `/recuperar${
    consultaRecuperar.toString() ? `?${consultaRecuperar.toString()}` : ''
  }`

  function irAVerificar(correo?: string) {
    const estado: EstadoVerificacion = { correo, desdeLogin: true }
    navegar(rutaVerificacion(volver), { state: estado })
  }

  const login = useLoginUnificado()
  const google = useLoginGoogle()
  const passkey = useLoginPasskey()
  const pendiente = login.isPending || google.isPending || passkey.isPending
  const esCliente = pestana === 'cliente'

  if (estaAutenticado) {
    // Con sesión ya abierta, un enlace profundo sigue a su destino si es
    // interno y seguro; si no, va al inicio del rol.
    return <Navigate to={volver ?? rutaInicialPorRol(tipo)} replace />
  }

  function cambiarPestana(valor: PestanaLogin) {
    setPestana(valor)
    guardarPestana(valor)
    setError(null)
    setErrorPasskey(null)
    setPasskeySinVerificar(false)
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!puedeEntrar || pendiente) return
    setError(null)
    login.mutate(
      { usuario: username.trim(), contrasena: password },
      {
        onSuccess: (respuesta) => {
          // Si un barbero entró desde "Cliente", la próxima vez abre en su pestaña.
          guardarPestana(respuesta.tipo === 'barbero' ? 'barbero' : 'cliente')
          const destino =
            volver ??
            (respuesta.tipo === 'barbero'
              ? destinoTrasEntrarBarbero()
              : rutaInicialPorRol('cliente'))
          navegar(destino, { replace: true })
        },
        onError: (fallo) => {
          // Cliente con correo sin verificar: pasa a la pantalla del código.
          if (esCorreoSinVerificar(fallo)) {
            irAVerificar(correoDesdeIdentificador(username))
            return
          }
          setError(mapearErrorLogin(fallo))
        },
      },
    )
  }

  function entrarConPasskey() {
    if (pendiente) return
    setError(null)
    setErrorPasskey(null)
    setPasskeySinVerificar(false)
    passkey.mutate(undefined, {
      onSuccess: () => {
        navegar(volver ?? '/mi', { replace: true })
      },
      onError: (fallo) => {
        // El hook borra la marca si el backend responde 401.
        setMarcaPasskey(leerMarcaPasskey())
        const mapeado = mapearErrorPasskey(fallo, 'login')
        setPasskeySinVerificar(esCorreoSinVerificar(fallo))
        if (!mapeado.silencioso) setErrorPasskey(mapeado.mensaje)
      },
    })
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

  const alertaAviso = aviso && (
    <p
      role="status"
      className={cn(
        CLASE_AVISO,
        aviso.tono === 'green'
          ? 'border-green-40 bg-green-10 text-green'
          : 'border-amber-30 bg-amber-10 text-amber',
      )}
    >
      {aviso.texto}
    </p>
  )

  const alertaError = error && (
    <p role="alert" className={cn(CLASE_AVISO, 'border-red-30 bg-red-10 text-red')}>
      {error}
    </p>
  )

  const formulario = (
    <form
      onSubmit={enviar}
      className="flex flex-col gap-4"
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

      {/* La contraseña del barbero la restablece el administrador. */}
      {esCliente && (
        <div className="-mt-1 flex justify-end">
          <Link to={destinoRecuperar} className={CLASE_ENLACE}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      )}

      {alertaError}

      <Button
        type="submit"
        className="w-full"
        disabled={!puedeEntrar || pendiente}
        cargando={login.isPending}
      >
        Entrar
      </Button>
    </form>
  )

  return (
    <main className="screen-login flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <header className="flex flex-col items-center text-center">
        <div className="relative mb-6 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute size-[200px] rounded-full bg-white-5 blur-2xl"
          />
          <Logo tamano="md" decorativo />
        </div>
        <h1 className="type-brand">KlippFlow</h1>
      </header>

      {recuperar ? (
        <section className="mx-auto mt-10 flex w-full max-w-[360px] flex-col gap-5">
          <h2 className="type-card-title text-center">
            Recupera tu cuenta de cliente
          </h2>
          <p className="type-helper text-center">
            ¿Te registraste con Google? Entra con Google para crear una
            contraseña nueva.
          </p>

          {alertaAviso}
          {alertaError}

          <BotonGoogle
            onCredential={entrarConGoogle}
            deshabilitado={pendiente}
          />
          <TextoAceptacionGoogle />
          <Link to={destinoRecuperar} className={CLASE_ENLACE}>
            Recuperar con un código al correo
          </Link>
          <Link to="/login" className={CLASE_ENLACE}>
            Volver a entrar
          </Link>
        </section>
      ) : (
        <div className="mx-auto mt-8 flex w-full max-w-[360px] flex-1 flex-col">
          <Segmented
            etiqueta="Tipo de cuenta"
            opciones={PESTANAS}
            valor={pestana}
            onCambio={cambiarPestana}
            className="w-full"
          />

          <div className="mt-6 flex flex-col gap-4">
            {alertaAviso}

            {esCliente ? (
              <>
                <BotonGoogle
                  onCredential={entrarConGoogle}
                  deshabilitado={pendiente}
                />

                {soporta && (
                  <Button
                    variante="ghost"
                    className="w-full border border-line bg-card"
                    onClick={entrarConPasskey}
                    disabled={pendiente}
                    cargando={passkey.isPending}
                    icono={
                      <Fingerprint aria-hidden="true" size={18} strokeWidth={1.6} />
                    }
                  >
                    {passkey.isPending
                      ? 'Esperando huella o PIN…'
                      : marcaPasskey
                        ? 'Entrar con huella o PIN'
                        : 'Entrar con passkey'}
                  </Button>
                )}

                {errorPasskey && (
                  <p role="alert" className="type-helper text-center text-red">
                    {errorPasskey}
                  </p>
                )}

                {passkeySinVerificar && (
                  <button
                    type="button"
                    onClick={() => irAVerificar()}
                    className={cn(CLASE_ENLACE, 'self-center')}
                  >
                    Verificar mi correo
                  </button>
                )}

                <div aria-hidden="true" className="my-1 flex items-center gap-3">
                  <span className="h-px flex-1 bg-line" />
                  <span className="type-helper">o</span>
                  <span className="h-px flex-1 bg-line" />
                </div>

                {formulario}
              </>
            ) : (
              <>
                {formulario}
                <button
                  type="button"
                  onClick={() => setAyudaAbierta(true)}
                  className={cn(CLASE_ENLACE, 'self-center')}
                >
                  ¿Problemas para entrar?
                </button>
              </>
            )}
          </div>

          <footer className="mt-auto flex flex-col items-center gap-4 pt-10 pb-6 text-center">
            {esCliente ? (
              <>
                <Link
                  to={destinoRegistro}
                  className="type-small inline-flex min-h-[var(--height-button-compact)] items-center justify-center gap-1 text-secondary"
                >
                  ¿Primera vez?
                  <span className="text-text underline underline-offset-2">
                    Crea tu cuenta
                  </span>
                </Link>
                <TextoAceptacionGoogle />
              </>
            ) : (
              <EnlacePrivacidad />
            )}
          </footer>
        </div>
      )}

      <Sheet
        abierto={ayudaAbierta}
        onCerrar={() => setAyudaAbierta(false)}
        titulo="¿Problemas para entrar?"
        descripcion="Tu cuenta la crea el administrador de KlippFlow."
        pie={
          <Button className="w-full" onClick={() => setAyudaAbierta(false)}>
            Entendido
          </Button>
        }
      >
        <p className="type-helper">
          Si no puedes entrar, tu cuenta puede estar suspendida o vencida.
        </p>
        <p className="type-helper mt-3">
          Pide al administrador que restablezca tu contraseña.
        </p>
      </Sheet>
    </main>
  )
}
