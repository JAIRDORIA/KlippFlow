import { describe, expect, it } from 'vitest'
import {
  BADGE_NOTIFICACION,
  construirOpcionesNotificacion,
  esPayloadCliente,
  ICONO_NOTIFICACION,
} from './notificacion'
import { RUTA_SOLICITUDES } from './urlDestino'

const ORIGEN = 'https://app.klippflow.test'

/** Comprueba que una ruta de asset sea absoluta desde la raíz. */
function esAbsoluta(ruta: string): boolean {
  return ruta.startsWith('/') && !ruta.startsWith('//')
}

describe('construirOpcionesNotificacion', () => {
  it('usa rutas absolutas para el ícono grande y el badge', () => {
    const opciones = construirOpcionesNotificacion('Cuerpo', '/solicitudes', ORIGEN)

    expect(esAbsoluta(opciones.icon)).toBe(true)
    expect(esAbsoluta(opciones.badge)).toBe(true)
    expect(opciones.icon).toBe(ICONO_NOTIFICACION)
    expect(opciones.badge).toBe(BADGE_NOTIFICACION)
    expect(opciones.icon).toBe('/icons/icon-192.png')
    expect(opciones.badge).toBe('/icons/badge-96.png')
  })

  it('normaliza la URL del clic y conserva el cuerpo', () => {
    const opciones = construirOpcionesNotificacion('Carlos · hoy', '/solicitudes', ORIGEN)

    expect(opciones.body).toBe('Carlos · hoy')
    expect(opciones.data.url).toBe(RUTA_SOLICITUDES)
  })

  it('cae al destino seguro si la URL es externa o falta', () => {
    expect(
      construirOpcionesNotificacion('x', 'https://evil.test/app/hoy', ORIGEN).data.url,
    ).toBe(RUTA_SOLICITUDES)
    expect(construirOpcionesNotificacion('x', undefined, ORIGEN).data.url).toBe(
      RUTA_SOLICITUDES,
    )
  })

  it('usa /mi para el cliente y conserva tag y zona', () => {
    const opciones = construirOpcionesNotificacion(
      'Tu cita fue aceptada',
      '/mi/citas/42',
      ORIGEN,
      'cita-42',
      'cliente',
    )

    expect(opciones.data).toEqual({ url: '/mi/citas/42', zona: 'cliente' })
    expect(opciones.tag).toBe('cita-42')
  })

  it('manda al cliente a /mi si la URL es externa', () => {
    expect(
      construirOpcionesNotificacion(
        'x',
        'https://evil.test/mi/citas/42',
        ORIGEN,
        undefined,
        'cliente',
      ).data.url,
    ).toBe('/mi')
  })
})

describe('esPayloadCliente', () => {
  it('reconoce tipo, citaId y URL de /mi', () => {
    expect(esPayloadCliente({ tipo: 'cita_aceptada' })).toBe(true)
    expect(esPayloadCliente({ citaId: 42 })).toBe(true)
    expect(esPayloadCliente({ url: '/mi/citas/42' })).toBe(true)
  })

  it('no confunde el payload del barbero', () => {
    expect(esPayloadCliente({ url: '/solicitudes', titulo: 'Nueva solicitud' })).toBe(
      false,
    )
    expect(esPayloadCliente({})).toBe(false)
  })
})
