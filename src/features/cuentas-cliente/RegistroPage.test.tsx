import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { CLAVE_SESION } from '@/shared/api/almacenamientoSesion'
import { RegistroPage } from './RegistroPage'

function crearToken(payload: Record<string, unknown>): string {
  const base64 = window
    .btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `eyJhbGciOiJIUzI1NiJ9.${base64}.firma-simulada`
}

function renderizarRegistro() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/registro']}>
          <Routes>
            <Route path="/registro" element={<RegistroPage />} />
            <Route path="/mi" element={<p>Mi cuenta</p>} />
            <Route path="/login" element={<p>Entrar</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

function completarFormulario() {
  fireEvent.change(screen.getByLabelText('Nombre'), {
    target: { value: '  Cliente Nuevo  ' },
  })
  fireEvent.change(screen.getByLabelText('Usuario'), {
    target: { value: 'Nuevo_Cliente' },
  })
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'ClaveSegura123' },
  })
  fireEvent.change(screen.getByLabelText('Celular'), {
    target: { value: '+57 300 111 2233' },
  })
  fireEvent.click(screen.getByRole('checkbox'))
}

beforeEach(() => {
  window.localStorage.clear()
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('RegistroPage', () => {
  it('crea la cuenta, guarda la sesión y omite el correo vacío', async () => {
    const fetchMock = vi.fn(
      async (entrada: RequestInfo | URL, opciones?: RequestInit) => {
        const url = String(entrada)
        const metodo = opciones?.method ?? 'GET'
        if (metodo === 'POST' && url.endsWith('/auth/cliente/registro')) {
          return new Response(
            JSON.stringify({
              accessToken: 'token-cliente-nuevo',
              tipo: 'cliente',
              cliente: {
                id: 5,
                nombre: 'Cliente Nuevo',
                username: 'nuevo_cliente',
                correo: null,
                celular: '3001112233',
              },
            }),
            {
              status: 201,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        return new Response(
          JSON.stringify({
            id: 5,
            nombre: 'Cliente Nuevo',
            username: 'nuevo_cliente',
            correo: null,
            celular: '3001112233',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },
    )
    vi.stubGlobal('fetch', fetchMock)

    renderizarRegistro()
    completarFormulario()

    const crear = screen.getByRole('button', { name: 'Crear cuenta' })
    expect(crear).toBeEnabled()
    fireEvent.click(crear)
    fireEvent.click(crear)

    expect(await screen.findByText('Mi cuenta')).toBeInTheDocument()

    const llamadasRegistro = fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith('/auth/cliente/registro'),
    )
    expect(llamadasRegistro).toHaveLength(1)
    expect(llamadasRegistro[0]?.[1]?.body).toBe(
      JSON.stringify({
        nombre: 'Cliente Nuevo',
        username: 'nuevo_cliente',
        contrasena: 'ClaveSegura123',
        celular: '3001112233',
      }),
    )
    const cabeceras = llamadasRegistro[0]?.[1]?.headers
    expect(cabeceras).toBeInstanceOf(Headers)
    expect(cabeceras instanceof Headers ? cabeceras.get('Content-Type') : null).toBe(
      'application/json',
    )
    expect(cabeceras instanceof Headers ? cabeceras.get('Authorization') : null).toBeNull()

    const sesion = JSON.parse(
      window.localStorage.getItem(CLAVE_SESION) ?? '{}',
    ) as {
      token?: string
      usuario?: { correo?: string | null }
    }
    expect(sesion.token).toBe('token-cliente-nuevo')
    expect(sesion.usuario?.correo).toBeNull()
    expect(JSON.stringify(sesion)).not.toContain('ClaveSegura123')
  })

  it('marca el campo username cuando el backend responde 409', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          message: 'Ese usuario ya está en uso',
          error: 'Conflict',
          statusCode: 409,
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    renderizarRegistro()
    completarFormulario()
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(
      (await screen.findAllByText('Ese usuario ya está en uso')).length,
    ).toBeGreaterThan(0)
    expect(screen.getByLabelText('Usuario')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.queryByText('Mi cuenta')).not.toBeInTheDocument()
  })

  it('muestra cada mensaje de un 400 en array', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          message: [
            'nombre should not be empty',
            'username must be longer than or equal to 4 characters',
            'celular must match /^3\\d{9}$/ regular expression',
          ],
          error: 'Bad Request',
          statusCode: 400,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    renderizarRegistro()
    completarFormulario()
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(
      (await screen.findAllByText('nombre should not be empty')).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(
        'username must be longer than or equal to 4 characters',
      ).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(
        'celular must match /^3\\d{9}$/ regular expression',
      ).length,
    ).toBeGreaterThan(0)
    expect(screen.getByLabelText('Nombre')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('bloquea el formulario si hay una sesión previa y permite cerrarla', async () => {
    const token = crearToken({
      sub: 9,
      tipo: 'cliente',
      username: 'cliente.previo',
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
    window.localStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({
        token,
        tipo: 'cliente',
        usuario: {
          tipo: 'cliente',
          id: 9,
          nombre: 'Cliente Previo',
          username: 'cliente.previo',
          correo: null,
          celular: '3001112233',
        },
      }),
    )

    renderizarRegistro()

    expect(
      screen.getByText('Ya tienes una sesión activa'),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByLabelText('Nombre')).toBeInTheDocument()
    await waitFor(() => {
      expect(window.localStorage.getItem(CLAVE_SESION)).toBeNull()
    })
  })
})
