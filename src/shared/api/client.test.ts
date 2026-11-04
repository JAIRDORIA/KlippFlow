import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CLAVE_SESION } from './almacenamientoSesion'
import { construirDestinoLogin, peticion } from './client'

type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

function respuestaJson(datos: unknown, status: number): Response {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

let fetchMock: ReturnType<typeof vi.fn<FetchMock>>

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000')
  window.localStorage.clear()
  fetchMock = vi.fn<FetchMock>()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('peticion', () => {
  it('hace la petición con JSON y devuelve el cuerpo tipado', async () => {
    fetchMock.mockResolvedValue(respuestaJson({ ok: true }, 200))

    const datos = await peticion<{ ok: boolean }>('/prueba', {
      metodo: 'POST',
      cuerpo: { nombre: 'Ana' },
      zona: 'publico',
    })

    expect(datos).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/prueba',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ nombre: 'Ana' }),
      }),
    )
  })

  it('inyecta el token de la zona barbero', async () => {
    window.localStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({ token: 'token-barbero', tipo: 'barbero' }),
    )
    fetchMock.mockResolvedValue(respuestaJson({ ok: true }, 200))

    await peticion('/barbero/dashboard/hoy', { zona: 'barbero' })

    const opciones = fetchMock.mock.calls[0]?.[1]
    const headers = new Headers(opciones?.headers)
    expect(headers.get('Authorization')).toBe('Bearer token-barbero')
  })

  it('normaliza errores con message string', async () => {
    fetchMock.mockResolvedValue(
      respuestaJson({ message: 'Cuenta no activa', statusCode: 403 }, 403),
    )

    await expect(
      peticion('/barbero/dashboard/hoy', {
        zona: 'publico',
        redirigirEn401: false,
      }),
    ).rejects.toMatchObject({
      status: 403,
      mensaje: 'Cuenta no activa',
    })
  })

  it('normaliza errores de validación con arreglo en campos', async () => {
    fetchMock.mockResolvedValue(
      respuestaJson(
        {
          message: ['precio must not be less than 1', 'duracionMinutos inválido'],
          statusCode: 400,
        },
        400,
      ),
    )

    await expect(
      peticion('/barbero/servicios', { metodo: 'POST', zona: 'barbero' }),
    ).rejects.toMatchObject({
      status: 400,
      mensaje: 'precio must not be less than 1',
      campos: ['precio must not be less than 1', 'duracionMinutos inválido'],
    })
  })

  it('normaliza 401 sin redirigir cuando se pide', async () => {
    fetchMock.mockResolvedValue(
      respuestaJson({ message: 'Usuario o contraseña incorrectos', statusCode: 401 }, 401),
    )

    await expect(
      peticion('/auth/login/barbero', {
        metodo: 'POST',
        zona: 'publico',
        redirigirEn401: false,
        cuerpo: { username: 'x', password: 'y' },
      }),
    ).rejects.toMatchObject({
      status: 401,
      mensaje: 'Usuario o contraseña incorrectos',
    })
  })

  it('convierte fallos de red en status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(peticion('/prueba', { zona: 'publico' })).rejects.toMatchObject({
      status: 0,
      mensaje: 'No pudimos conectar. Revisa tu internet.',
    })
  })

  it('devuelve undefined en 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    await expect(peticion('/barbero/compras/1', { metodo: 'DELETE', zona: 'barbero' })).resolves.toBeUndefined()
  })

  it('falla claro si falta VITE_API_URL', async () => {
    vi.stubEnv('VITE_API_URL', '')
    await expect(peticion('/prueba', { zona: 'publico' })).rejects.toMatchObject({
      status: 0,
      mensaje: 'Falta configurar VITE_API_URL en el archivo .env.',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('en 401 limpia la sesión de cliente', async () => {
    window.history.replaceState({}, '', '/login')
    window.localStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({ token: 'token-cliente', tipo: 'cliente' }),
    )
    fetchMock.mockResolvedValue(
      respuestaJson({ message: 'Sesión inválida', statusCode: 401 }, 401),
    )

    await expect(
      peticion('/cliente/perfil', { zona: 'cliente' }),
    ).rejects.toMatchObject({ status: 401 })

    expect(window.localStorage.getItem(CLAVE_SESION)).toBeNull()
  })

  it('construye el destino del login conservando solo volver seguro', () => {
    expect(construirDestinoLogin('cliente', 'sesion-expirada', '/mi')).toBe(
      '/login?motivo=sesion-expirada&volver=%2Fmi',
    )
    expect(construirDestinoLogin('barbero', 'sesion-expirada', '/app/hoy')).toBe(
      '/login?motivo=sesion-expirada',
    )
    expect(construirDestinoLogin('admin', 'expirada', '/admin')).toBe(
      '/admin/login?motivo=expirada',
    )
  })
})
