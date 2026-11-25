import { Eye, EyeOff } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import type { DatosRegistroCliente } from '@/features/auth/types'
import { useAuth } from '@/features/auth/useAuth'
import { EnlacePrivacidad } from '@/features/legal/components/EnlacePrivacidad'
import { puedeCrearCuenta } from '@/features/legal/domain/aceptacion'
import { rutaInicialPorRol, volverSeguro } from '@/shared/lib/rutas'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Logo } from '@/shared/ui/Logo'
import {
  mapearErrorRegistro,
  type CampoRegistro,
  type ErrorRegistroMapeado,
} from './domain/errores'
import {
  normalizarCelularRegistro,
  normalizarCorreoRegistro,
  normalizarUsername,
  validarCelularRegistro,
  validarContrasena,
  validarCorreoRegistro,
  validarNombreRegistro,
  validarUsername,
} from './domain/validadores'
import { useRegistroCliente } from './hooks'
import {
  rutaVerificacion,
  type EstadoVerificacion,
} from './verificacion'

const TODOS_TOCADOS: Record<CampoRegistro, boolean> = {
  nombre: false,
  username: false,
  contrasena: false,
  celular: false,
  correo: false,
}

export function RegistroPage() {
  const { sesion, tipo, cerrarSesion } = useAuth()
  useTituloPagina()
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const volver = volverSeguro(parametros.get('volver'))

  const [nombre, setNombre] = useState('')
  const [username, setUsername] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [celular, setCelular] = useState('')
  const [correo, setCorreo] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [aceptaTratamiento, setAceptaTratamiento] = useState(false)
  const [tocados, setTocados] =
    useState<Record<CampoRegistro, boolean>>(TODOS_TOCADOS)
  const [errorEnvio, setErrorEnvio] = useState<ErrorRegistroMapeado | null>(null)
  const [saliendo, setSaliendo] = useState(false)
  const [errorCierre, setErrorCierre] = useState<string | null>(null)
  const enviando = useRef(false)

  const registro = useRegistroCliente()

  const errorNombre = validarNombreRegistro(nombre)
  const errorUsername = validarUsername(username)
  const errorContrasena = validarContrasena(contrasena, username)
  const errorCelular = validarCelularRegistro(celular)
  const errorCorreo = validarCorreoRegistro(correo)

  const formularioValido =
    !errorNombre &&
    !errorUsername &&
    !errorContrasena &&
    !errorCelular &&
    !errorCorreo &&
    nombre.trim().length > 0 &&
    username.trim().length > 0 &&
    contrasena.length > 0 &&
    celular.length > 0 &&
    correo.trim().length > 0
  const puedeEnviar = puedeCrearCuenta(formularioValido, aceptaTratamiento)
  const pendiente = registro.isPending

  async function cerrarLaSesion() {
    if (saliendo) return
    setSaliendo(true)
    setErrorCierre(null)
    try {
      await cerrarSesion()
    } catch {
      setErrorCierre('No pudimos cerrar la sesión. Inténtalo de nuevo.')
    } finally {
      setSaliendo(false)
    }
  }

  function errorDeCampo(
    campo: CampoRegistro,
    valor: string,
    errorLocal: string | null,
  ): string | undefined {
    const errorBackend = errorEnvio?.campos[campo]
    if (errorBackend) return errorBackend
    return tocados[campo] || valor.length > 0 ? errorLocal ?? undefined : undefined
  }

  function marcar(campo: CampoRegistro) {
    setTocados((actual) => ({ ...actual, [campo]: true }))
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!puedeEnviar || enviando.current || registro.isPending) return

    setTocados({ ...TODOS_TOCADOS })
    setErrorEnvio(null)

    const celularNormalizado = normalizarCelularRegistro(celular)
    if (!celularNormalizado) return

    const datos: DatosRegistroCliente = {
      nombre: nombre.trim(),
      username: normalizarUsername(username),
      contrasena,
      celular: celularNormalizado,
      correo: normalizarCorreoRegistro(correo),
    }

    enviando.current = true
    registro.mutate(datos, {
      // La cuenta queda creada pero sin sesión: primero se verifica el correo.
      onSuccess: (respuesta) => {
        const estado: EstadoVerificacion = {
          correo: respuesta.correo,
          mensaje: respuesta.mensaje,
        }
        navegar(rutaVerificacion(volver), { replace: true, state: estado })
      },
      onError: (fallo) => {
        setErrorEnvio(mapearErrorRegistro(fallo))
      },
      onSettled: () => {
        enviando.current = false
      },
    })
  }

  if (sesion) {
    return (
      <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
        <div className="mx-auto flex w-full max-w-[420px] flex-col gap-6">
          <Logo tamano="sm" />
          <header className="flex flex-col gap-3">
            <h1 className="type-public-title">Ya tienes una sesión activa</h1>
            <p className="type-form text-secondary">
              Para crear otra cuenta con usuario y contraseña, primero cierra la
              sesión actual.
            </p>
          </header>

          {errorCierre && (
            <p
              role="alert"
              className="type-small rounded-[var(--radius-warning)] border border-red-30 bg-red-10 p-[var(--space-warning)] text-red"
            >
              {errorCierre}
            </p>
          )}

          <Button
            type="button"
            variante="danger"
            className="w-full"
            cargando={saliendo}
            onClick={() => void cerrarLaSesion()}
          >
            Cerrar sesión
          </Button>

          <Link
            to={volver ?? rutaInicialPorRol(tipo)}
            className="type-small inline-flex min-h-[var(--height-button-compact)] items-center justify-center text-secondary underline underline-offset-2 hover:text-text"
          >
            Volver
          </Link>

          <footer className="mt-4 text-center">
            <EnlacePrivacidad />
          </footer>
        </div>
      </main>
    )
  }

  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-8">
        <header className="flex flex-col gap-4">
          <Logo tamano="sm" />
          <div>
            <h1 className="type-public-title">Crear cuenta de cliente</h1>
            <p className="type-form mt-3 text-secondary">
              Regístrate con tu usuario y contraseña para reservar y seguir tus
              citas.
            </p>
          </div>
        </header>

        <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
          <Input
            etiqueta="Nombre"
            name="nombre"
            value={nombre}
            onChange={(evento) => {
              setNombre(evento.target.value)
              setErrorEnvio(null)
            }}
            onBlur={() => marcar('nombre')}
            error={errorDeCampo('nombre', nombre, errorNombre)}
            autoComplete="name"
            maxLength={100}
            placeholder="Tu nombre"
          />

          <Input
            etiqueta="Usuario"
            name="username"
            value={username}
            onChange={(evento) => {
              setUsername(evento.target.value.toLowerCase())
              setErrorEnvio(null)
            }}
            onBlur={() => marcar('username')}
            error={errorDeCampo('username', username, errorUsername)}
            ayuda="De 4 a 20 caracteres: minúsculas, números, punto y guion bajo."
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="tu.usuario"
          />

          <Input
            id="registro-contrasena"
            etiqueta="Contraseña"
            name="contrasena"
            type={mostrarContrasena ? 'text' : 'password'}
            value={contrasena}
            onChange={(evento) => {
              setContrasena(evento.target.value)
              setErrorEnvio(null)
            }}
            onBlur={() => marcar('contrasena')}
            error={errorDeCampo('contrasena', contrasena, errorContrasena)}
            ayuda="Entre 8 y 72 caracteres y distinta del usuario."
            autoComplete="new-password"
            placeholder="Tu contraseña"
            accionDerecha={
              <button
                type="button"
                aria-label={
                  mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                aria-pressed={mostrarContrasena}
                aria-controls="registro-contrasena"
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

          <Input
            etiqueta="Celular"
            name="celular"
            value={celular}
            onChange={(evento) => {
              setCelular(evento.target.value)
              setErrorEnvio(null)
            }}
            onBlur={() => marcar('celular')}
            error={errorDeCampo('celular', celular, errorCelular)}
            ayuda="Ejemplo 3001234567. Puedes escribir +57 y espacios."
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            placeholder="3001234567"
          />

          <Input
            etiqueta="Correo electrónico"
            name="correo"
            type="email"
            value={correo}
            onChange={(evento) => {
              setCorreo(evento.target.value)
              setErrorEnvio(null)
            }}
            onBlur={() => marcar('correo')}
            error={errorDeCampo('correo', correo, errorCorreo)}
            ayuda="Te enviaremos un código de 6 dígitos para verificarlo."
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={255}
            placeholder="tu@correo.com"
          />

          <label className="type-small flex min-h-[var(--height-button-compact)] cursor-pointer items-start gap-3 text-secondary">
            <input
              type="checkbox"
              name="aceptaTratamiento"
              checked={aceptaTratamiento}
              onChange={(evento) => setAceptaTratamiento(evento.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-accent"
            />
            <span>
              Autorizo el tratamiento de mis datos personales según la{' '}
              <a
                href="/privacidad"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(evento) => evento.stopPropagation()}
                className="underline underline-offset-2 hover:text-text"
              >
                Política de privacidad
              </a>
            </span>
          </label>

          {errorEnvio && (
            <div
              role="alert"
              className="type-small rounded-[var(--radius-warning)] border border-red-30 bg-red-10 p-[var(--space-warning)] text-red"
            >
              {errorEnvio.detalle.length > 1 ? (
                <ul className="flex list-disc flex-col gap-1 pl-5">
                  {errorEnvio.detalle.map((mensaje, indice) => (
                    <li key={`${indice}-${mensaje}`}>{mensaje}</li>
                  ))}
                </ul>
              ) : (
                <p>{errorEnvio.mensaje}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="mt-2 w-full"
            disabled={!puedeEnviar || pendiente}
            cargando={registro.isPending}
          >
            Crear cuenta
          </Button>

          <p className="type-helper text-center">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="underline underline-offset-2 hover:text-text"
            >
              Entra aquí
            </Link>
          </p>
        </form>

        <footer className="text-center">
          <EnlacePrivacidad />
        </footer>
      </div>
    </main>
  )
}
