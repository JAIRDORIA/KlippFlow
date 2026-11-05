import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthProvider'
import { LoginPage } from './LoginPage'

function renderizarLogin(entrada = '/login') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[entrada]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/app/hoy" element={<p>Hoy</p>} />
            <Route path="/mi" element={<p>Mi cuenta</p>} />
            <Route path="/registro/completar" element={<p>Completar</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('LoginPage', () => {
  it('no muestra passkey si el navegador no la soporta', () => {
    renderizarLogin()

    expect(
      screen.queryByRole('button', { name: /passkey|huella o PIN/i }),
    ).not.toBeInTheDocument()
  })

  it('mantiene el botón Entrar desactivado hasta completar ambos campos', () => {
    renderizarLogin()

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

  it('sin VITE_GOOGLE_CLIENT_ID muestra el aviso de Google no disponible', () => {
    renderizarLogin()

    expect(screen.getByText('Inicio con Google no disponible')).toBeInTheDocument()
    expect(
      screen.getByText('Si es tu primera vez, crearás tu cuenta de cliente.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Barberos: usa el usuario y la contraseña que te dio el administrador.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Soy cliente y olvidé mi contraseña' }),
    ).toHaveAttribute('href', '/login?recuperar=1')
  })

  it('en modo recuperación solo muestra Google', () => {
    renderizarLogin('/login?recuperar=1')

    expect(
      screen.getByText('Recupera tu cuenta de cliente'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Entra con Google para crear una contraseña nueva.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Inicio con Google no disponible')).toBeInTheDocument()
    expect(screen.queryByLabelText('Usuario')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument()
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
})
