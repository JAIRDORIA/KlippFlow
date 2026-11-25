import { describe, expect, it } from 'vitest'
import {
  USERNAMES_RESERVADOS,
  normalizarCelularRegistro,
  normalizarCodigo,
  normalizarCorreoRegistro,
  normalizarIdentificador,
  normalizarUsername,
  validarCelular,
  validarCelularRegistro,
  validarContrasena,
  validarCodigo,
  validarCorreoRegistro,
  validarIdentificador,
  validarNombreRegistro,
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

describe('registro de cliente', () => {
  it('normaliza el celular quitando todo lo que no sea dígito y el 57', () => {
    expect(normalizarCelularRegistro('+57 300 111 2233')).toBe('3001112233')
    expect(normalizarCelularRegistro('57 300 111 2233')).toBe('3001112233')
    expect(normalizarCelularRegistro('(300) 111-2233')).toBe('3001112233')
    expect(normalizarCelularRegistro('3001112233')).toBe('3001112233')
    expect(normalizarCelularRegistro('2001112233')).toBeNull()
    expect(normalizarCelularRegistro('300111223')).toBeNull()
    expect(validarCelularRegistro('+57 300 111 2233')).toBeNull()
    expect(validarCelularRegistro('2001112233')).toBe(
      'Escribe un celular de 10 dígitos que empiece por 3.',
    )
  })

  it('exige nombre de 1 a 100 caracteres después de trim', () => {
    expect(validarNombreRegistro('Cliente Nuevo')).toBeNull()
    expect(validarNombreRegistro('A')).toBeNull()
    expect(validarNombreRegistro('   ')).toBe('Escribe tu nombre.')
    expect(validarNombreRegistro('a'.repeat(100))).toBeNull()
    expect(validarNombreRegistro('a'.repeat(101))).toBe(
      'El nombre no puede superar 100 caracteres.',
    )
  })

  it('exige el correo y lo normaliza a minúsculas', () => {
    expect(normalizarCorreoRegistro('   ')).toBe('')
    expect(normalizarCorreoRegistro(' Nuevo@Example.COM ')).toBe(
      'nuevo@example.com',
    )
    expect(validarCorreoRegistro('')).toBe('Escribe tu correo.')
    expect(validarCorreoRegistro('   ')).toBe('Escribe tu correo.')
    expect(validarCorreoRegistro('nuevo@example.com')).toBeNull()
    expect(validarCorreoRegistro('no-es-correo')).toBe(
      'Escribe un correo válido.',
    )
    expect(validarCorreoRegistro(`${'a'.repeat(250)}@x.com`)).toBe(
      'El correo no puede superar 255 caracteres.',
    )
  })
})

describe('código de verificación', () => {
  it('deja solo dígitos, corta a 6 y conserva los ceros a la izquierda', () => {
    expect(normalizarCodigo('012345')).toBe('012345')
    expect(normalizarCodigo(' 01 23-45 ')).toBe('012345')
    expect(normalizarCodigo('0123456789')).toBe('012345')
    expect(normalizarCodigo('abc')).toBe('')
  })

  it('exige exactamente 6 dígitos', () => {
    expect(validarCodigo('012345')).toBeNull()
    expect(validarCodigo('12345')).toBe('El código debe tener 6 dígitos.')
    expect(validarCodigo('')).toBe('El código debe tener 6 dígitos.')
  })
})

describe('identificador de recuperación', () => {
  it('acepta username o correo de 3 a 255 caracteres', () => {
    expect(validarIdentificador('ana')).toBeNull()
    expect(validarIdentificador('nuevo@example.com')).toBeNull()
    expect(validarIdentificador('  ab ')).toBe('Escribe tu usuario o tu correo.')
    expect(validarIdentificador('a'.repeat(256))).toBe(
      'No puede superar 255 caracteres.',
    )
  })

  it('normaliza a minúsculas sin espacios', () => {
    expect(normalizarIdentificador('  Nuevo@Example.COM ')).toBe(
      'nuevo@example.com',
    )
  })
})
