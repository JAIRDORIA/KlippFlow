import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useTituloPagina } from '@/app/useTituloPagina'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Logo } from '@/shared/ui/Logo'
import { rutaInicialPorRol, volverSeguro } from '@/shared/lib/rutas'
import { mapearErrorCompletarCuenta } from './domain/errores'
import {
  validarCelular,
  validarContrasena,
  validarNombrePerfil,
  validarUsername,
} from './domain/validadores'
import { useCompletarCuenta } from './hooks'

type Campo = 'nombre' | 'username' | 'contrasena' | 'celular'

export function CompletarCuentaPage() {
  const { sesion, tipo, registroPendiente } = useAuth()
  useTituloPagina()
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const volver = volverSeguro(parametros.get('volver'))

  const [nombre, setNombre] = useState(registroPendiente?.perfil.nombre ?? '')
  const [username, setUsername] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [celular, setCelular] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [tocados, setTocados] = useState<Record<Campo, boolean>>({
    nombre: false,
    username: false,
    contrasena: false,
    celular: false,
  })
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)

  const mutacion = useCompletarCuenta()

  if (sesion) {
    return <Navigate to={volver ?? rutaInicialPorRol(tipo)} replace />
  }

  if (!registroPendiente) {
    const destino = new URLSearchParams({ motivo: 'google-reiniciar' })
    if (volver) destino.set('volver', volver)
    return <Navigate to={`/login?${destino.toString()}`} replace />
  }

  const errorNombre = validarNombrePerfil(nombre)
  const errorUsername = validarUsername(username)
  const errorContrasena = validarContrasena(contrasena, username)
  const errorCelular = validarCelular(celular)
  const valido =
    !errorNombre &&
    !errorUsername &&
    !errorContrasena &&
    !errorCelular &&
    username.length > 0 &&
    contrasena.length > 0 &&
    celular.length > 0

  function mostrar(campo: Campo, valor: string): string | undefined {
    const error =
      campo === 'nombre'
        ? errorNombre
        : campo === 'username'
          ? errorUsername
          : campo === 'contrasena'
            ? errorContrasena
            : errorCelular
    return tocados[campo] || valor.length > 0 ? error ?? undefined : undefined
  }

  function marcar(campo: Campo) {
    setTocados((actual) => ({ ...actual, [campo]: true }))
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!valido || mutacion.isPending) return
    setErrorEnvio(null)
    mutacion.mutate(
      {
        nombre: nombre.trim(),
        username: username.trim().toLowerCase(),
        contrasena,
        celular,
      },
      {
        onSuccess: () => navegar(volver ?? '/mi', { replace: true }),
        onError: (fallo) => setErrorEnvio(mapearErrorCompletarCuenta(fallo)),
      },
    )
  }

  return (
    <main className="screen flex min-h-[calc(100dvh-48px)] flex-col max-[899px]:min-h-dvh">
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-8">
        <header className="flex flex-col gap-4">
          <Logo tamano="sm" />
          <h1 className="type-public-title">Completa tu cuenta</h1>
          <p className="type-form text-secondary">
            Elige tu usuario y una contraseña para reservar con tu cuenta.
          </p>
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
            error={mostrar('nombre', nombre)}
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
            error={mostrar('username', username)}
            ayuda="De 4 a 20 caracteres: minúsculas, números, punto y guion bajo."
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={20}
            placeholder="tu.usuario"
          />

          <Input
            id="completar-contrasena"
            etiqueta="Contraseña"
            name="contrasena"
            type={mostrarContrasena ? 'text' : 'password'}
            value={contrasena}
            onChange={(evento) => {
              setContrasena(evento.target.value)
              setErrorEnvio(null)
            }}
            onBlur={() => marcar('contrasena')}
            error={mostrar('contrasena', contrasena)}
            ayuda="Entre 8 y 72 caracteres y distinta del usuario."
            autoComplete="new-password"
            placeholder="Tu contraseña"
            accionDerecha={
              <button
                type="button"
                aria-label={
                  mostrarContrasena
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
                aria-pressed={mostrarContrasena}
                aria-controls="completar-contrasena"
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
            error={mostrar('celular', celular)}
            ayuda="Ejemplo 3001234567. Puedes escribir +57 y espacios."
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            placeholder="3001234567"
          />

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
            Crear cuenta
          </Button>
        </form>
      </div>
    </main>
  )
}
