import { describe, expect, it } from 'vitest'
import {
  USERNAMES_RESERVADOS,
  normalizarUsername,
  validarCelular,
  validarContrasena,
  validarPerfilCliente,
  validarUsername,
} from './validadores'

describe('username', () => {
  it('normaliza a minúsculas y recorta espacios', () => {
    expect(normalizarUsername('  Ana.Perez_1  ')).toBe('ana.perez_1')
    expect(validarUsername('  Ana.Perez_1  ')).toBeNull()
  })

  it('exige entre 4 y 20 caracteres', () => {
    expect(validarUsername('abc')).toBe(
      'El usuario debe tener entre 4 y 20 caracteres.',
    )
    expect(validarUsername('abcd')).toBeNull()
    expect(validarUsername('a'.repeat(20))).toBeNull()
    expect(validarUsername('a'.repeat(21))).toBe(
      'El usuario debe tener entre 4 y 20 caracteres.',
    )
  })

  it('solo acepta minúsculas, números, punto y guion bajo', () => {
    expect(validarUsername('ana perez')).toBe(
      'El usuario solo puede tener minúsculas, números, punto y guion bajo.',
    )
    expect(validarUsername('ana-perez')).toBe(
      'El usuario solo puede tener minúsculas, números, punto y guion bajo.',
    )
    expect(validarUsername('anañ')).toBe(
      'El usuario solo puede tener minúsculas, números, punto y guion bajo.',
    )
    expect(validarUsername('ana_99')).toBeNull()
  })

  it('no empieza ni termina en punto o guion bajo', () => {
    expect(validarUsername('.ana')).toBe(
      'El usuario no puede empezar ni terminar en punto o guion bajo.',
    )
    expect(validarUsername('ana_')).toBe(
      'El usuario no puede empezar ni terminar en punto o guion bajo.',
    )
    expect(validarUsername('_ana')).toBe(
      'El usuario no puede empezar ni terminar en punto o guion bajo.',
    )
    expect(validarUsername('ana.')).toBe(
      'El usuario no puede empezar ni terminar en punto o guion bajo.',
    )
  })

  it('no permite dos puntos seguidos', () => {
    expect(validarUsername('ana..perez')).toBe(
      'El usuario no puede tener dos puntos seguidos.',
    )
  })

  it('rechaza todos los reservados', () => {
    for (const reservado of USERNAMES_RESERVADOS) {
      expect(validarUsername(reservado)).toBe('Ese usuario no está disponible.')
    }
  })
})

describe('contraseña', () => {
  it('exige de 8 a 72 caracteres', () => {
    expect(validarContrasena('1234567', 'ana')).toBe(
      'La contraseña debe tener entre 8 y 72 caracteres.',
    )
    expect(validarContrasena('12345678', 'ana')).toBeNull()
    expect(validarContrasena('a'.repeat(72), 'ana')).toBeNull()
    expect(validarContrasena('a'.repeat(73), 'ana')).toBe(
      'La contraseña debe tener entre 8 y 72 caracteres.',
    )
  })

  it('debe ser distinta del usuario normalizado', () => {
    expect(validarContrasena('ana.perez', '  ANA.PEREZ ')).toBe(
      'La contraseña debe ser distinta del usuario.',
    )
    expect(validarContrasena('Ana.Perez1', 'ana.perez')).toBeNull()
  })
})

describe('celular', () => {
  it('acepta +57, espacios y diez dígitos que empiezan por 3', () => {
    expect(validarCelular('3001234567')).toBeNull()
    expect(validarCelular('+57 300 123 4567')).toBeNull()
    expect(validarCelular('57 300 123 4567')).toBeNull()
    expect(validarCelular('  300 123 4567  ')).toBeNull()
  })

  it('rechaza longitudes, prefijos y caracteres inválidos', () => {
    expect(validarCelular('2001234567')).toBe(
      'Escribe un celular de 10 dígitos que empiece por 3.',
    )
    expect(validarCelular('300123')).toBe(
      'Escribe un celular de 10 dígitos que empiece por 3.',
    )
    expect(validarCelular('3001234567abc')).toBe(
      'Escribe un celular de 10 dígitos que empiece por 3.',
    )
    expect(validarCelular('(300) 123-4567')).toBe(
      'Escribe un celular de 10 dígitos que empiece por 3.',
    )
  })
})

describe('perfil de cliente', () => {
  it('valida nombre y celular juntos', () => {
    expect(validarPerfilCliente({ nombre: 'Ana', celular: '3001234567' })).toEqual(
      {},
    )
    expect(validarPerfilCliente({ nombre: 'A', celular: '2001234567' })).toEqual({
      nombre: 'Escribe tu nombre.',
      celular: 'Escribe un celular de 10 dígitos que empiece por 3.',
    })
  })
})
