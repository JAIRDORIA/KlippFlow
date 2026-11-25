import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './AuthProvider'
import { LoginPage } from './LoginPage'

/** Muestra el estado y la consulta con los que llegó la navegación. */
function VerificarEspia() {
  const { state, search } = useLocation()
  return <p>Verificar{search}: {JSON.stringify(state)}</p>
}

function respuestaJson(status: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderizarLogin(entrada = '/login') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[entrada]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/app/hoy" element={<p>Hoy</p>} />
            <Route path="/mi" element={<p>Mi cuenta</p>} />
            <Route path="/registro/completar" element={<p>Completar</p>} />
            <Route path="/registro/verificar" element={<VerificarEspia />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

/** El selector de tipo de cuenta decide qué accesos se muestran. */
function elegirBarbero() {
  fireEvent.click(screen.getByRole('radio', { name: 'Barbero' }))
}

beforeEach(() => {
  window.localStorage.clear()
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
})

afterEach(() => {
  // Los stubs de WebAuthn no pasan por `vi.stubGlobal`.
  Reflect.deleteProperty(window.navigator, 'credentials')
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('LoginPage', () => {
  it('empieza en cliente y muestra Google, recuperación y registro', () => {
    renderizarLogin()

    expect(screen.getByRole('radio', { name: 'Cliente' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByText('Inicio con Google no disponible')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Crea tu cuenta/i })).toHaveAttribute(
      'href',
      '/registro',
    )

    // El cliente también ve siempre su formulario de usuario y contraseña.
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' }),
    ).toHaveAttribute('href', '/recuperar')
  })

  it('al elegir barbero oculta los accesos de cliente', () => {
    renderizarLogin()
    elegirBarbero()

    expect(screen.getByRole('radio', { name: 'Barbero' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(
      screen.getByRole('button', { name: '¿Problemas para entrar?' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument()
    expect(
      screen.queryByText('Inicio con Google no disponible'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: '¿Olvidaste tu contraseña?' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Crea tu cuenta/i }),
    ).not.toBeInTheDocument()
  })

  it('muestra una sola vez el enlace a la política de privacidad', () => {
    renderizarLogin()
    expect(
      screen.getAllByRole('link', { name: 'Política de privacidad' }),
    ).toHaveLength(1)

    elegirBarbero()
    expect(
      screen.getAllByRole('link', { name: 'Política de privacidad' }),
    ).toHaveLength(1)
  })

  it('no muestra passkey si el navegador no la soporta', () => {
    renderizarLogin()

    expect(
      screen.queryByRole('button', { name: /passkey|huella o PIN/i }),
    ).not.toBeInTheDocument()
  })

  it('ofrece el acceso con passkey cuando el navegador la soporta', () => {
    vi.stubGlobal('PublicKeyCredential', function PublicKeyCredential() {})
    Object.defineProperty(window.navigator, 'credentials', {
      configurable: true,
      value: { create: () => undefined, get: () => undefined },
    })

    renderizarLogin()

    expect(
      screen.getByRole('button', { name: 'Entrar con passkey' }),
    ).toBeInTheDocument()

    // En barbero no aplica: las passkeys son de cliente.
    elegirBarbero()
    expect(
      screen.queryByRole('button', { name: /passkey|huella o PIN/i }),
    ).not.toBeInTheDocument()
  })

  it('mantiene el botón Entrar desactivado hasta completar ambos campos', () => {
    renderizarLogin()
    elegirBarbero()

    const entrar = screen.getByRole('button', { name: 'Entrar' })
    expect(entrar).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Usuario'), {
      target: { value: 'barbero1' },
    })
    expect(entrar).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'Barbero2026' },
    })
    expect(entrar).toBeEnabled()
  })

  it('muestra y oculta la contraseña desde el toggle', () => {
    renderizarLogin()
    elegirBarbero()

    const campo = screen.getByLabelText('Contraseña')
    expect(campo).toHaveAttribute('type', 'password')

    const mostrar = screen.getByRole('button', { name: 'Mostrar contraseña' })
    expect(mostrar).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(mostrar)
    expect(campo).toHaveAttribute('type', 'text')
    expect(
      screen.getByRole('button', { name: 'Ocultar contraseña' }),
    ).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(campo).toHaveAttribute('type', 'password')
  })

  it('explica en un sheet cómo resolver el acceso del barbero', () => {
    renderizarLogin()
    elegirBarbero()

    fireEvent.click(
      screen.getByRole('button', { name: '¿Problemas para entrar?' }),
    )

    const dialogo = screen.getByRole('dialog')
    expect(
      within(dialogo).getByText('Tu cuenta la crea el administrador de KlippFlow.'),
    ).toBeInTheDocument()
    expect(
      within(dialogo).getByText(
        'Pide al administrador que restablezca tu contraseña.',
      ),
    ).toBeInTheDocument()
  })

  it('conserva el destino seguro al enlazar al registro', () => {
    renderizarLogin('/login?volver=%2Fmi')

    // `volver` debe sobrevivir tanto al registro como a la recuperación.
    expect(screen.getByRole('radio', { name: 'Cliente' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(
      screen.getByRole('link', { name: /Crea tu cuenta/i }),
    ).toHaveAttribute('href', '/registro?volver=%2Fmi')
    expect(
      screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' }),
    ).toHaveAttribute('href', '/recuperar?volver=%2Fmi')
  })

  it('recuerda la pestaña Barbero en el dispositivo', () => {
    const { unmount } = renderizarLogin()
    elegirBarbero()
    unmount()

    renderizarLogin()
    expect(screen.getByRole('radio', { name: 'Barbero' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument()
  })

  it('con volver abre en Cliente aunque se haya recordado Barbero', () => {
    window.localStorage.setItem('kf_login_pestana', 'barbero')
    renderizarLogin('/login?volver=%2Fmi')

    expect(screen.getByRole('radio', { name: 'Cliente' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('en modo recuperación con Google solo muestra Google', () => {
    renderizarLogin('/login?recuperar=1')

    expect(
      screen.getByRole('heading', { name: 'Recupera tu cuenta de cliente' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Te registraste con Google\? Entra con Google/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Recuperar con un código al correo' }),
    ).toHaveAttribute('href', '/recuperar')
    expect(screen.getByText('Inicio con Google no disponible')).toBeInTheDocument()
    expect(screen.queryByLabelText('Usuario')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Volver a entrar' }),
    ).toHaveAttribute('href', '/login')
  })

  it('tras un login de cliente navega a /mi', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          accessToken: 'token-cliente',
          tipo: 'cliente',
          cliente: {
            id: 2,
            nombre: 'Cliente',
            username: 'cliente.uno',
            correo: 'cliente@example.com',
            celular: '3001112233',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    renderizarLogin()

    fireEvent.change(screen.getByLabelText('Usuario'), {
      target: { value: 'cliente.uno' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'ClaveSegura1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Mi cuenta')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/auth/login',
      expect.objectContaining({
        body: JSON.stringify({
          usuario: 'cliente.uno',
          contrasena: 'ClaveSegura1',
        }),
      }),
    )
    expect(window.localStorage.getItem('klippflow.sesion')).toContain(
      '"tipo":"cliente"',
    )
  })

  it('con 403 de correo sin verificar pasa a verificar con el correo escrito', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respuestaJson(403, {
          message: 'Debes verificar tu correo antes de iniciar sesión',
          statusCode: 403,
        }),
      ),
    )

    renderizarLogin('/login?volver=%2Fmi%2Fcitas')

    fireEvent.change(screen.getByLabelText('Usuario'), {
      target: { value: ' Nuevo@Example.com ' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'ClaveSegura1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    const destino = await screen.findByText(/^Verificar/)
    expect(destino.textContent).toContain('?volver=%2Fmi%2Fcitas')
    expect(destino.textContent).toContain('"correo":"nuevo@example.com"')
    expect(destino.textContent).toContain('"desdeLogin":true')
    expect(window.localStorage.getItem('klippflow.sesion')).toBeNull()
  })

  it('con 403 de correo sin verificar y username no precarga correo', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respuestaJson(403, {
          message: 'Debes verificar tu correo antes de iniciar sesión',
          statusCode: 403,
        }),
      ),
    )

    renderizarLogin()

    fireEvent.change(screen.getByLabelText('Usuario'), {
      target: { value: 'nuevo_cliente' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'ClaveSegura1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    const destino = await screen.findByText(/^Verificar/)
    expect(destino.textContent).not.toContain('correo')
    expect(destino.textContent).toContain('"desdeLogin":true')
  })

  it('el 403 de cuenta desactivada se queda en el login', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respuestaJson(403, {
          message: 'Tu cuenta de cliente está desactivada',
          statusCode: 403,
        }),
      ),
    )

    renderizarLogin()

    fireEvent.change(screen.getByLabelText('Usuario'), {
      target: { value: 'cliente.uno' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'ClaveSegura1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu cuenta no está activa',
    )
    expect(screen.queryByText(/^Verificar/)).not.toBeInTheDocument()
  })

  it('avisa que la contraseña se restableció', () => {
    renderizarLogin('/login?motivo=contrasena-restablecida')

    expect(
      screen.getByText('Contraseña actualizada. Entra con tu nueva contraseña.'),
    ).toHaveAttribute('role', 'status')
  })
})
