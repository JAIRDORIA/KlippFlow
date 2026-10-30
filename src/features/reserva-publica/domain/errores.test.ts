import { describe, expect, it } from 'vitest'
import { ErrorPeticion } from '@/shared/api/client'
import { esError404, mapearErrorCreacion } from './errores'

describe('mapearErrorCreacion', () => {
  it('mapea 409 de horario y pide recargar', () => {
    expect(
      mapearErrorCreacion(
        new ErrorPeticion({
          status: 409,
          mensaje: 'Ese horario ya no está disponible',
        }),
      ),
    ).toEqual({
      mensaje: 'Ese horario ya no está disponible. Elige otro.',
      recargarHorarios: true,
      descartarHora: true,
    })
  })

  it('mapea 409 de celular con solicitud pendiente', () => {
    expect(
      mapearErrorCreacion(
        new ErrorPeticion({
          status: 409,
          mensaje:
            'Ya tienes una solicitud pendiente de respuesta. Espera la respuesta del barbero para hacer otra',
        }),
      ),
    ).toEqual({
      mensaje:
        'Ya tienes una solicitud pendiente con este celular. Espera la respuesta del barbero.',
      recargarHorarios: false,
      descartarHora: false,
    })
  })

  it('mapea 400 con mensajes de validación', () => {
    expect(
      mapearErrorCreacion(
        new ErrorPeticion({
          status: 400,
          mensaje: 'Servicio no válido',
          campos: ['Servicio no válido', 'Celular inválido'],
        }),
      ),
    ).toMatchObject({
      mensaje: 'Servicio no válido · Celular inválido',
      recargarHorarios: false,
    })
  })

  it('mapea 429, 404, red y 500', () => {
    expect(
      mapearErrorCreacion(
        new ErrorPeticion({
          status: 429,
          mensaje: 'ThrottlerException: Too Many Requests',
        }),
      ).mensaje,
    ).toBe('Demasiados intentos. Intenta de nuevo en unos minutos.')

    expect(
      mapearErrorCreacion(
        new ErrorPeticion({ status: 404, mensaje: 'Barbero no encontrado' }),
      ).mensaje,
    ).toBe('No encontramos esta barbería.')

    expect(
      mapearErrorCreacion(
        new ErrorPeticion({
          status: 0,
          mensaje: 'No pudimos conectar. Revisa tu internet.',
        }),
      ).mensaje,
    ).toBe('No pudimos conectar. Revisa tu internet.')

    expect(
      mapearErrorCreacion(
        new ErrorPeticion({ status: 500, mensaje: 'Error interno' }),
      ).mensaje,
    ).toBe('Algo salió mal. Inténtalo de nuevo.')
  })

  it('reconoce 404', () => {
    expect(
      esError404(new ErrorPeticion({ status: 404, mensaje: 'No existe' })),
    ).toBe(true)
    expect(esError404(new ErrorPeticion({ status: 400, mensaje: 'No' }))).toBe(
      false,
    )
    expect(esError404(new Error('otro'))).toBe(false)
  })
})
