import { describe, expect, it } from 'vitest'
import { RUTA_SOLICITUDES, urlDestinoSegura } from './urlDestino'

const ORIGEN = 'https://app.klippflow.test'

describe('urlDestinoSegura', () => {
  it('traduce la ruta heredada del backend', () => {
    expect(urlDestinoSegura('/solicitudes', ORIGEN)).toBe(RUTA_SOLICITUDES)
  })

  it('acepta rutas internas relativas', () => {
    expect(urlDestinoSegura('/app/hoy', ORIGEN)).toBe('/app/hoy')
    expect(urlDestinoSegura('/app/solicitudes?x=1', ORIGEN)).toBe(
      '/app/solicitudes?x=1',
    )
  })

  it('acepta una URL absoluta del mismo origen', () => {
    expect(urlDestinoSegura(`${ORIGEN}/app/cuentas`, ORIGEN)).toBe('/app/cuentas')
  })

  it('rechaza otro origen', () => {
    expect(urlDestinoSegura('https://evil.test/app/hoy', ORIGEN)).toBe(RUTA_SOLICITUDES)
    expect(urlDestinoSegura('//evil.test/app/hoy', ORIGEN)).toBe(RUTA_SOLICITUDES)
    expect(urlDestinoSegura('http://app.klippflow.test/app/hoy', ORIGEN)).toBe(
      RUTA_SOLICITUDES,
    )
  })

  it('rechaza esquemas peligrosos', () => {
    expect(urlDestinoSegura('javascript:alert(1)', ORIGEN)).toBe(RUTA_SOLICITUDES)
    expect(urlDestinoSegura('data:text/html,<h1>x</h1>', ORIGEN)).toBe(RUTA_SOLICITUDES)
  })

  it('cae al destino por defecto sin URL', () => {
    expect(urlDestinoSegura(undefined, ORIGEN)).toBe(RUTA_SOLICITUDES)
    expect(urlDestinoSegura(null, ORIGEN)).toBe(RUTA_SOLICITUDES)
    expect(urlDestinoSegura('', ORIGEN)).toBe(RUTA_SOLICITUDES)
  })

  it('cae al destino por defecto con un origen inválido', () => {
    expect(urlDestinoSegura('/app/hoy', 'no-es-origen')).toBe(RUTA_SOLICITUDES)
  })
})
