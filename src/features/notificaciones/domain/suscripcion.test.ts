import { describe, expect, it } from 'vitest'
import { clavesDeSuscripcion } from './suscripcion'

function suscripcionFalsa(datos: {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
}): PushSubscription {
  return {
    endpoint: datos.endpoint ?? '',
    toJSON: () => ({
      endpoint: datos.endpoint,
      expirationTime: null,
      keys: datos.keys,
    }),
  } as unknown as PushSubscription
}

describe('clavesDeSuscripcion', () => {
  it('arma el cuerpo documentado por la API', () => {
    const cuerpo = clavesDeSuscripcion(
      suscripcionFalsa({
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
        keys: { p256dh: 'BN...', auth: 'xyz' },
      }),
    )

    expect(cuerpo).toEqual({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      keys: { p256dh: 'BN...', auth: 'xyz' },
    })
  })

  it('devuelve null si falta alguna llave', () => {
    expect(
      clavesDeSuscripcion(
        suscripcionFalsa({ endpoint: 'https://push.test/1', keys: { auth: 'x' } }),
      ),
    ).toBeNull()

    expect(
      clavesDeSuscripcion(
        suscripcionFalsa({ endpoint: 'https://push.test/1', keys: { p256dh: 'x' } }),
      ),
    ).toBeNull()

    expect(clavesDeSuscripcion(suscripcionFalsa({ endpoint: 'https://push.test/1' }))).toBeNull()
  })

  it('devuelve null sin endpoint', () => {
    expect(
      clavesDeSuscripcion(
        suscripcionFalsa({ keys: { p256dh: 'a', auth: 'b' } }),
      ),
    ).toBeNull()
  })
})
