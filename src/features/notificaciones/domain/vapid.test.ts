import { describe, expect, it } from 'vitest'
import { claveVapidABytes } from './vapid'

describe('claveVapidABytes', () => {
  it('convierte base64url sin relleno', () => {
    expect(Array.from(claveVapidABytes('AQID') ?? [])).toEqual([1, 2, 3])
  })

  it('convierte con relleno', () => {
    expect(Array.from(claveVapidABytes('AQI=') ?? [])).toEqual([1, 2])
  })

  it('acepta los caracteres - y _ de base64url', () => {
    expect(Array.from(claveVapidABytes('-_8') ?? [])).toEqual([0xfb, 0xff])
    expect(Array.from(claveVapidABytes('-__-') ?? [])).toEqual([0xfb, 0xff, 0xfe])
  })

  it('ignora espacios alrededor', () => {
    expect(Array.from(claveVapidABytes('  AQID  ') ?? [])).toEqual([1, 2, 3])
  })

  it('devuelve null con la llave vacía', () => {
    expect(claveVapidABytes('')).toBeNull()
    expect(claveVapidABytes('   ')).toBeNull()
  })

  it('devuelve null con caracteres inválidos', () => {
    expect(claveVapidABytes('***')).toBeNull()
    expect(claveVapidABytes('AQ ID')).toBeNull()
    expect(claveVapidABytes('A')).toBeNull()
  })

  it('convierte una llave de 65 bytes (tamaño de una llave VAPID) sin relleno', () => {
    const bytes = claveVapidABytes(
      'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A',
    )

    expect(bytes).not.toBeNull()
    expect(bytes?.length).toBe(65)
    expect(bytes?.[0]).toBe(0)
    expect(bytes?.[64]).toBe(64)
  })
})
