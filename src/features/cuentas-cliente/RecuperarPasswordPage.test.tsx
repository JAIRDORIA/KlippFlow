import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { RecuperarPasswordPage } from './RecuperarPasswordPage'

const MENSAJE_GENERICO =
  'Si el usuario existe y tiene un correo verificado, recibirás un código de 6 dígitos.'

function respuestaJson(status: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function LoginEspia() {
  const { search } = useLocation()
  return <p>Entrar{search}</p>
}

function renderizar(entrada = '/recuperar') {
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
            <Route path="/recuperar" element={<RecuperarPasswordPage />} />
            <Route path="/login" element={<LoginEspia />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

/** Responde la solicitud genérica y, para restablecer, lo que se indique. */
function mockFetch(restablecer: () => Response) {
  const fetchMock = vi.fn<typeof fetch>(
    async (url) => {
      if (String(url).endsWith('/auth/cliente/recuperar-password')) {
        return respuestaJson(200, { ok: true, mensaje: MENSAJE_GENERICO })
      }
      return restablecer()
    },
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function pedirCodigo(identificador: string) {
  fireEvent.change(screen.getByLabelText('Usuario o correo'), {
    target: { value: identificador },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }))
  await screen.findByText(MENSAJE_GENERICO)
}

beforeEach(() => {
  window.localStorage.clear()
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('RecuperarPasswordPage', () => {
  it('pide el código, restablece la contraseña y vuelve al login', async () => {
    const fetchMock = mockFetch(() => respuestaJson(200, { ok: true }))

    renderizar('/recuperar?volver=%2Fmi')
    await pedirCodigo('  Nuevo_Cliente ')

    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({ identificador: 'nuevo_cliente' }),
    )
    expect(screen.getByText('nuevo_cliente')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Código de 6 dígitos'), {
      target: { value: '012345' },
    })
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: 'NuevaClave123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    const login = await screen.findByText(/^Entrar/)
    expect(login.textContent).toContain('motivo=contrasena-restablecida')
    expect(login.textContent).toContain('volver=%2Fmi')

    const [url, opciones] = fetchMock.mock.calls[1] ?? []
    expect(String(url)).toBe('http://localhost:3000/auth/cliente/restablecer-password')
    expect(opciones?.body).toBe(
      JSON.stringify({
        identificador: 'nuevo_cliente',
        codigo: '012345',
        nuevaContrasena: 'NuevaClave123',
      }),
    )
  })

  it('muestra el error del backend con un código inválido', async () => {
    mockFetch(() =>
      respuestaJson(400, { message: 'Código inválido o vencido', statusCode: 400 }),
    )

    renderizar()
    await pedirCodigo('nuevo@example.com')

    fireEvent.change(screen.getByLabelText('Código de 6 dígitos'), {
      target: { value: '999999' },
    })
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: 'NuevaClave123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Código inválido o vencido',
    )
    expect(screen.queryByText(/^Entrar/)).not.toBeInTheDocument()
  })

  it('no deja usar el username como contraseña', async () => {
    mockFetch(() => respuestaJson(200, { ok: true }))

    renderizar()
    await pedirCodigo('nuevo_cliente')

    fireEvent.change(screen.getByLabelText('Código de 6 dígitos'), {
      target: { value: '123456' },
    })
    const contrasena = screen.getByLabelText('Nueva contraseña')
    fireEvent.change(contrasena, { target: { value: 'nuevo_cliente' } })
    fireEvent.blur(contrasena)

    expect(
      screen.getByText('La contraseña debe ser distinta del usuario.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar contraseña' })).toBeDisabled()
  })

  it('permite cambiar de cuenta y ofrece la vía de Google', async () => {
    mockFetch(() => respuestaJson(200, { ok: true }))

    renderizar()
    expect(
      screen.getByRole('link', { name: /Te registraste con Google/ }),
    ).toHaveAttribute('href', '/login?recuperar=1')

    await pedirCodigo('nuevo_cliente')
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar' }))

    expect(screen.getByLabelText('Usuario o correo')).toHaveValue('nuevo_cliente')
    expect(screen.queryByLabelText('Código de 6 dígitos')).not.toBeInTheDocument()
  })
})
