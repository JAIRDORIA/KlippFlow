import { describe, expect, it } from 'vitest'
import {
  ALFABETO,
  AMBIGUOS,
  LONGITUD_PASSWORD_PROVISIONAL,
  generarPasswordProvisional,
  passwordProvisionalValida,
} from './password'

/** Fuente determinista: devuelve los bytes indicados en ciclo. */
function fuenteFija(valores: number[]): (destino: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer> {
  let indice = 0
  return (destino) => {
    destino[0] = valores[indice % valores.length] ?? 0
    indice += 1
    return destino
  }
}

function fuenteSecuencial(): (destino: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer> {
  let indice = 0
  return (destino) => {
    destino[0] = indice % 256
    indice += 1
    return destino
  }
}

const tieneCrypto = typeof globalThis.crypto?.getRandomValues === 'function'

describe('generarPasswordProvisional', () => {
  it('genera 12 caracteres por defecto', () => {
    expect(generarPasswordProvisional(undefined, fuenteSecuencial())).toHaveLength(
      LONGITUD_PASSWORD_PROVISIONAL,
    )
  })

  it('respeta una longitud personalizada', () => {
    expect(generarPasswordProvisional(8, fuenteSecuencial())).toHaveLength(8)
    expect(generarPasswordProvisional(20, fuenteSecuencial())).toHaveLength(20)
  })

  it('solo usa caracteres del alfabeto seguro', () => {
    const password = generarPasswordProvisional(undefined, fuenteSecuencial())
    for (const caracter of password) {
      expect(ALFABETO).toContain(caracter)
    }
  })

  it('no incluye caracteres ambiguos', () => {
    for (let intento = 0; intento < 40; intento += 1) {
      const password = generarPasswordProvisional(undefined, fuenteSecuencial())
      for (const ambiguo of AMBIGUOS) {
        expect(password).not.toContain(ambiguo)
      }
    }
  })

  it('siempre trae mayúscula, minúscula y dígito', () => {
    for (let intento = 0; intento < 40; intento += 1) {
      const password = generarPasswordProvisional(undefined, fuenteSecuencial())
      expect(password).toMatch(/[A-Z]/)
      expect(password).toMatch(/[a-z]/)
      expect(password).toMatch(/[0-9]/)
    }
  })

  it('lanza si la longitud no permite una de cada grupo', () => {
    expect(() => generarPasswordProvisional(2, fuenteSecuencial())).toThrow()
    expect(() => generarPasswordProvisional(3.5, fuenteSecuencial())).toThrow()
  })

  it('es determinista con la misma fuente aleatoria', () => {
    const primera = generarPasswordProvisional(12, fuenteFija([1, 2, 3, 4, 5, 6, 7, 8]))
    const segunda = generarPasswordProvisional(12, fuenteFija([1, 2, 3, 4, 5, 6, 7, 8]))
    expect(primera).toBe(segunda)
  })

  it.runIf(tieneCrypto)('usa crypto.getRandomValues por defecto', () => {
    const password = generarPasswordProvisional()
    expect(passwordProvisionalValida(password)).toBe(true)
  })
})

describe('passwordProvisionalValida', () => {
  it('acepta una contraseña que cumple las reglas', () => {
    expect(passwordProvisionalValida('Abcdef234567')).toBe(true)
  })

  it('rechaza longitudes distintas de 12', () => {
    expect(passwordProvisionalValida('Abcdef23')).toBe(false)
    expect(passwordProvisionalValida('Abcdef2345678')).toBe(false)
  })

  it('rechaza si falta un grupo', () => {
    expect(passwordProvisionalValida('abcdef234567')).toBe(false)
    expect(passwordProvisionalValida('ABCDEF234567')).toBe(false)
    expect(passwordProvisionalValida('Abcdefghijkl')).toBe(false)
  })

  it('rechaza caracteres ambiguos', () => {
    expect(passwordProvisionalValida('Abcdef23456O')).toBe(false)
    expect(passwordProvisionalValida('Abcdef23456l')).toBe(false)
  })
})
