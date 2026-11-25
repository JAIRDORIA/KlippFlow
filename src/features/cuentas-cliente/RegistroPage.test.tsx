import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
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

/** Muestra el estado con el que llegó la navegación a la verificación. */
function VerificarEspia() {
  const { state } = useLocation()
  return <p>Verificar: {JSON.stringify(state)}</p>
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
            <Route path="/registro/verificar" element={<VerificarEspia />} />
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
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: '  Nuevo@Example.COM ' },
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
  it('crea la cuenta sin iniciar sesión y pasa a verificar el correo', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(
          JSON.stringify({
            requiereVerificacion: true,
            correo: 'nuevo@example.com',
            mensaje:
              'Cuenta creada. Te enviamos un código de 6 dígitos al correo para verificarla.',
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
    )
    vi.stubGlobal('fetch', fetchMock)

    renderizarRegistro()
    completarFormulario()

    const crear = screen.getByRole('button', { name: 'Crear cuenta' })
    expect(crear).toBeEnabled()
    fireEvent.click(crear)
    fireEvent.click(crear)

    const destino = await screen.findByText(/^Verificar:/)
    expect(destino.textContent).toContain('"correo":"nuevo@example.com"')
    expect(destino.textContent).toContain('Te enviamos un código')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, opciones] = fetchMock.mock.calls[0] ?? []
    expect(String(url)).toMatch(/\/auth\/cliente\/registro$/)
    expect(opciones?.body).toBe(
      JSON.stringify({
        nombre: 'Cliente Nuevo',
        username: 'nuevo_cliente',
        contrasena: 'ClaveSegura123',
        celular: '3001112233',
        correo: 'nuevo@example.com',
      }),
    )
    const cabeceras = opciones?.headers
    expect(cabeceras).toBeInstanceOf(Headers)
    expect(cabeceras instanceof Headers ? cabeceras.get('Authorization') : null).toBeNull()

    // El registro ya no devuelve token: no hay sesión hasta verificar.
    expect(window.localStorage.getItem(CLAVE_SESION)).toBeNull()
  })

  it('no deja crear la cuenta sin correo', () => {
    renderizarRegistro()
    completarFormulario()
    const campoCorreo = screen.getByLabelText('Correo electrónico')
    fireEvent.change(campoCorreo, { target: { value: '' } })
    fireEvent.blur(campoCorreo)

    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeDisabled()
    expect(screen.getByText('Escribe tu correo.')).toBeInTheDocument()
  })

  it('marca el campo correo cuando el backend responde 409 de correo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            message: 'Ese correo ya está registrado',
            error: 'Conflict',
            statusCode: 409,
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    renderizarRegistro()
    completarFormulario()
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(
      (await screen.findAllByText('Ese correo ya está registrado')).length,
    ).toBeGreaterThan(0)
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByLabelText('Usuario')).not.toHaveAttribute('aria-invalid')
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
