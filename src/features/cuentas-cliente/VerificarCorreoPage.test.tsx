import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { CLAVE_SESION } from '@/shared/api/almacenamientoSesion'
import { VerificarCorreoPage } from './VerificarCorreoPage'
import type { EstadoVerificacion } from './verificacion'

const MENSAJE_REENVIO =
  'Si la cuenta existe y no está verificada, recibirás un nuevo código.'

function respuestaJson(status: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function crearToken(payload: Record<string, unknown>): string {
  const base64 = window
    .btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `eyJhbGciOiJIUzI1NiJ9.${base64}.firma-simulada`
}

function renderizar(estado?: EstadoVerificacion, search = '') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter
          initialEntries={[{ pathname: '/registro/verificar', search, state: estado }]}
        >
          <Routes>
            <Route path="/registro/verificar" element={<VerificarCorreoPage />} />
            <Route path="/mi" element={<p>Mi cuenta</p>} />
            <Route path="/mi/citas" element={<p>Mis citas</p>} />
            <Route path="/login" element={<p>Entrar</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

function sesionVerificada() {
  const token = crearToken({
    sub: 5,
    tipo: 'cliente',
    username: 'nuevo_cliente',
    metodo: 'password',
    exp: Math.floor(Date.now() / 1000) + 3600,
  })
  return {
    accessToken: token,
    tipo: 'cliente',
    cliente: {
      id: 5,
      nombre: 'Cliente Nuevo',
      username: 'nuevo_cliente',
      correo: 'nuevo@example.com',
      celular: '3001112233',
    },
  }
}

beforeEach(() => {
  window.localStorage.clear()
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('VerificarCorreoPage', () => {
  it('precarga el correo, envía el código como string e inicia sesión', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        respuestaJson(200, sesionVerificada()),
    )
    vi.stubGlobal('fetch', fetchMock)

    renderizar(
      {
        correo: 'nuevo@example.com',
        mensaje:
          'Cuenta creada. Te enviamos un código de 6 dígitos al correo para verificarla.',
      },
      '?volver=%2Fmi%2Fcitas',
    )

    expect(screen.getByText('nuevo@example.com')).toBeInTheDocument()
    expect(screen.getByText(/Te enviamos un código/)).toBeInTheDocument()
    // Con el correo ya conocido no se pide de nuevo.
    expect(screen.queryByLabelText('Correo electrónico')).not.toBeInTheDocument()

    const codigo = screen.getByLabelText('Código de 6 dígitos')
    expect(codigo).toHaveAttribute('inputmode', 'numeric')
    expect(codigo).toHaveAttribute('maxlength', '6')

    const verificar = screen.getByRole('button', { name: 'Verificar' })
    fireEvent.change(codigo, { target: { value: '01234' } })
    expect(verificar).toBeDisabled()
    fireEvent.change(codigo, { target: { value: '0 1 2 3 4 5 9' } })
    expect(codigo).toHaveValue('012345')

    fireEvent.click(verificar)

    expect(await screen.findByText('Mis citas')).toBeInTheDocument()
    const [url, opciones] = fetchMock.mock.calls[0] ?? []
    expect(String(url)).toBe('http://localhost:3000/auth/cliente/verificar-correo')
    expect(opciones?.body).toBe(
      JSON.stringify({ correo: 'nuevo@example.com', codigo: '012345' }),
    )
    expect(window.localStorage.getItem(CLAVE_SESION)).toContain('"tipo":"cliente"')
  })

  it('muestra el error del backend con un código vencido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respuestaJson(400, {
          message: 'Código inválido o vencido',
          statusCode: 400,
        }),
      ),
    )

    renderizar({ correo: 'nuevo@example.com' })

    fireEvent.change(screen.getByLabelText('Código de 6 dígitos'), {
      target: { value: '999999' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Código inválido o vencido',
    )
    expect(window.localStorage.getItem(CLAVE_SESION)).toBeNull()
  })

  it('reenvía el código, muestra el mensaje genérico y bloquea 60 s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        respuestaJson(200, { ok: true, mensaje: MENSAJE_REENVIO }),
    )
    vi.stubGlobal('fetch', fetchMock)

    renderizar({ correo: 'nuevo@example.com' })

    fireEvent.change(screen.getByLabelText('Código de 6 dígitos'), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Reenviar código' }))

    expect(await screen.findByText(MENSAJE_REENVIO)).toBeInTheDocument()
    const [url, opciones] = fetchMock.mock.calls[0] ?? []
    expect(String(url)).toBe(
      'http://localhost:3000/auth/cliente/reenviar-codigo-verificacion',
    )
    expect(opciones?.body).toBe(JSON.stringify({ correo: 'nuevo@example.com' }))

    // El código anterior quedó invalidado.
    expect(screen.getByLabelText('Código de 6 dígitos')).toHaveValue('')
    expect(screen.getByRole('button', { name: /Reenviar en 1:00/ })).toBeDisabled()

    // La cuenta regresiva programa un segundo por render.
    for (let segundo = 0; segundo < 60; segundo += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })
    }

    expect(screen.getByRole('button', { name: 'Reenviar código' })).toBeEnabled()
  })

  it('sin correo en el estado lo pide y avisa si viene del login', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        respuestaJson(200, sesionVerificada()),
    )
    vi.stubGlobal('fetch', fetchMock)

    renderizar({ desdeLogin: true })

    expect(
      screen.getByText('Debes verificar tu correo antes de iniciar sesión'),
    ).toBeInTheDocument()

    const verificar = screen.getByRole('button', { name: 'Verificar' })
    fireEvent.change(screen.getByLabelText('Código de 6 dígitos'), {
      target: { value: '123456' },
    })
    expect(verificar).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: ' Nuevo@Example.COM ' },
    })
    fireEvent.click(verificar)

    expect(await screen.findByText('Mi cuenta')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({ correo: 'nuevo@example.com', codigo: '123456' }),
    )
  })
})
