import { describe, expect, it } from 'vitest'
import { ErrorPeticion } from '@/shared/api/client'
import {
  fechaHoraPasskey,
  mapearErrorPasskey,
  nombreSugeridoDispositivo,
  soportaPasskeys,
  tipoDispositivoLegible,
} from './passkeys'

function error(status: number, mensaje = 'x', campos?: string[]) {
  return new ErrorPeticion({ status, mensaje, campos })
}

describe('soportaPasskeys', () => {
  it('es false sin las APIs de WebAuthn', () => {
    expect(soportaPasskeys({})).toBe(false)
    expect(
      soportaPasskeys({
        contextoSeguro: true,
        tienePublicKeyCredential: true,
        tieneCredenciales: false,
      }),
    ).toBe(false)
  })

  it('exige contexto seguro y ambas APIs', () => {
    expect(
      soportaPasskeys({
        contextoSeguro: true,
        tienePublicKeyCredential: true,
        tieneCredenciales: true,
      }),
    ).toBe(true)
    expect(
      soportaPasskeys({
        contextoSeguro: false,
        tienePublicKeyCredential: true,
        tieneCredenciales: true,
      }),
    ).toBe(false)
  })
})

describe('mapearErrorPasskey', () => {
  it('mapea el login 401 con el texto pedido', () => {
    expect(mapearErrorPasskey(error(401), 'login')).toEqual({
      mensaje:
        'No se pudo iniciar sesión con la passkey. Usa tu usuario y contraseña.',
      silencioso: false,
    })
  })

  it('mapea tope 409, 429 y 503', () => {
    expect(mapearErrorPasskey(error(409)).mensaje).toBe(
      'Ya tienes 5 passkeys. Borra una para agregar otra.',
    )
    expect(mapearErrorPasskey(error(429)).mensaje).toBe(
      'Demasiados intentos, espera un momento.',
    )
    expect(mapearErrorPasskey(error(503)).mensaje).toBe(
      'Passkeys no disponibles por ahora.',
    )
  })

  it('mapea 400 con el mensaje de la API y 0 como red', () => {
    expect(
      mapearErrorPasskey(error(400, 'Debes enviar tu contraseña actual')).mensaje,
    ).toBe('Debes enviar tu contraseña actual')
    expect(mapearErrorPasskey(error(0)).mensaje).toContain('No pudimos conectar')
  })

  it('trata la cancelación como silenciosa', () => {
    expect(
      mapearErrorPasskey(new DOMException('cancelado', 'NotAllowedError')),
    ).toEqual({
      mensaje: 'No se completó. Puedes intentarlo de nuevo.',
      silencioso: true,
    })
    expect(
      mapearErrorPasskey(new DOMException('abortado', 'AbortError')).silencioso,
    ).toBe(true)
  })

  it('mapea InvalidStateError solo en registro', () => {
    expect(
      mapearErrorPasskey(
        new DOMException('ya existe', 'InvalidStateError'),
        'registro',
      ).mensaje,
    ).toBe('Este dispositivo ya tiene una passkey para tu cuenta.')
    expect(
      mapearErrorPasskey(
        new DOMException('ya existe', 'InvalidStateError'),
        'login',
      ),
    ).toEqual({
      mensaje: 'No pudimos completar la operación. Inténtalo de nuevo.',
      silencioso: false,
    })
  })

  it('usa genérico para desconocidos', () => {
    expect(mapearErrorPasskey(new Error('boom'))).toEqual({
      mensaje: 'No pudimos completar la operación. Inténtalo de nuevo.',
      silencioso: false,
    })
  })
})

describe('nombreSugeridoDispositivo', () => {
  it('detecta iPhone, Android, Windows y Mac', () => {
    expect(nombreSugeridoDispositivo('Mozilla/5.0 (iPhone; CPU iPhone OS 17)')).toBe(
      'iPhone',
    )
    expect(nombreSugeridoDispositivo('Mozilla/5.0 (Linux; Android 14)')).toBe(
      'Android',
    )
    expect(nombreSugeridoDispositivo('Mozilla/5.0 (Windows NT 10.0)')).toBe(
      'Windows',
    )
    expect(
      nombreSugeridoDispositivo('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)'),
    ).toBe('Mac')
    expect(nombreSugeridoDispositivo('')).toBe('Mi dispositivo')
  })
})

describe('presentación de passkeys', () => {
  it('traduce el tipo de dispositivo', () => {
    expect(tipoDispositivoLegible('singleDevice')).toBe('Este dispositivo')
    expect(tipoDispositivoLegible('multiDevice')).toBe(
      'Sincronizada entre dispositivos',
    )
    expect(tipoDispositivoLegible('otro')).toBe('otro')
  })

  it('formatea fechas y tolera valores inválidos', () => {
    expect(fechaHoraPasskey(null)).toBe('—')
    expect(fechaHoraPasskey('no-es-fecha')).toBe('—')
    expect(fechaHoraPasskey('2026-11-05T15:30:00.000Z')).toContain('2026')
  })
})
