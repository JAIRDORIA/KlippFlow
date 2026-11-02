import { describe, expect, it } from 'vitest'
import {
  BADGE_NOTIFICACION,
  construirOpcionesNotificacion,
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
})
