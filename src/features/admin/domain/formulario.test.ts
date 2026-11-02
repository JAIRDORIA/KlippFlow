import { describe, expect, it } from 'vitest'
import { generarPasswordProvisional } from './password'
import {
  APELLIDOS_MAX,
  BARBERIA_MAX,
  CORREO_MAX,
  NOMBRES_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  USUARIO_MAX,
  USUARIO_MIN,
  validarFormularioBarbero,
  validarPassword,
  type EntradaBarbero,
} from './formulario'

const VALIDA: EntradaBarbero = {
  nombres: 'Ana',
  apellidos: 'Paz',
  nombreBarberia: 'Ana Barber',
  username: 'ana.paz',
  correo: 'ana@example.com',
  password: 'contrasena-de-prueba',
}

describe('validarFormularioBarbero', () => {
  it('acepta un formulario válido y arma el cuerpo exacto', () => {
    const resultado = validarFormularioBarbero(VALIDA)

    expect(resultado.valido).toBe(true)
    expect(resultado.errores).toEqual({})
    expect(resultado.cuerpo).toEqual({
      username: 'ana.paz',
      password: 'contrasena-de-prueba',
      nombres: 'Ana',
      apellidos: 'Paz',
      correo: 'ana@example.com',
      nombreBarberia: 'Ana Barber',
    })
  })

  it('recorta y normaliza usuario y correo, y omite la barbería vacía', () => {
    const resultado = validarFormularioBarbero({
      ...VALIDA,
      username: '  Ana.Paz  ',
      correo: '  ANA@Example.com ',
      nombreBarberia: '   ',
    })

    expect(resultado.cuerpo?.username).toBe('ana.paz')
    expect(resultado.cuerpo?.correo).toBe('ana@example.com')
    expect(resultado.cuerpo).not.toHaveProperty('nombreBarberia')
  })

  it('exige nombre y apellidos', () => {
    const resultado = validarFormularioBarbero({ ...VALIDA, nombres: '  ', apellidos: '' })

    expect(resultado.valido).toBe(false)
    expect(resultado.errores.nombres).toContain('nombre')
    expect(resultado.errores.apellidos).toContain('apellidos')
    expect(resultado.cuerpo).toBeNull()
  })

  it('respeta los límites de nombre y apellidos', () => {
    expect(
      validarFormularioBarbero({ ...VALIDA, nombres: 'a'.repeat(NOMBRES_MAX) }).valido,
    ).toBe(true)
    expect(
      validarFormularioBarbero({ ...VALIDA, nombres: 'a'.repeat(NOMBRES_MAX + 1) }).errores
        .nombres,
    ).toContain(String(NOMBRES_MAX))

    expect(
      validarFormularioBarbero({ ...VALIDA, apellidos: 'a'.repeat(APELLIDOS_MAX) }).valido,
    ).toBe(true)
    expect(
      validarFormularioBarbero({ ...VALIDA, apellidos: 'a'.repeat(APELLIDOS_MAX + 1) })
        .errores.apellidos,
    ).toContain(String(APELLIDOS_MAX))
  })

  it('permite barbería vacía y rechaza más de 150', () => {
    expect(validarFormularioBarbero({ ...VALIDA, nombreBarberia: '' }).valido).toBe(true)
    expect(
      validarFormularioBarbero({
        ...VALIDA,
        nombreBarberia: 'a'.repeat(BARBERIA_MAX),
      }).valido,
    ).toBe(true)
    expect(
      validarFormularioBarbero({
        ...VALIDA,
        nombreBarberia: 'a'.repeat(BARBERIA_MAX + 1),
      }).errores.nombreBarberia,
    ).toContain(String(BARBERIA_MAX))
  })

  it('valida el usuario: 3–50 y solo minúsculas, números, punto, guion y guion bajo', () => {
    expect(validarFormularioBarbero({ ...VALIDA, username: 'ab' }).errores.username).toContain(
      String(USUARIO_MIN),
    )
    expect(
      validarFormularioBarbero({ ...VALIDA, username: 'a'.repeat(USUARIO_MAX + 1) }).errores
        .username,
    ).toContain(String(USUARIO_MAX))
    expect(
      validarFormularioBarbero({ ...VALIDA, username: 'a'.repeat(USUARIO_MAX) }).valido,
    ).toBe(true)

    for (const invalido of ['ana paz', 'ana@paz', 'ana/paz', 'ana:paz', 'ñandu']) {
      expect(validarFormularioBarbero({ ...VALIDA, username: invalido }).errores.username).toBeDefined()
    }
  })

  it('valida el correo obligatorio', () => {
    expect(validarFormularioBarbero({ ...VALIDA, correo: '' }).errores.correo).toContain(
      'correo',
    )
    for (const invalido of ['ana', 'ana@', 'ana@example', '@example.com', 'ana @x.com']) {
      expect(validarFormularioBarbero({ ...VALIDA, correo: invalido }).errores.correo).toBeDefined()
    }
    expect(
      validarFormularioBarbero({
        ...VALIDA,
        correo: `${'a'.repeat(CORREO_MAX)}@x.com`,
      }).errores.correo,
    ).toContain(String(CORREO_MAX))
  })

  it('valida la contraseña entre 8 y 72', () => {
    expect(validarFormularioBarbero({ ...VALIDA, password: '' }).errores.password).toContain(
      'contraseña',
    )
    expect(
      validarFormularioBarbero({ ...VALIDA, password: 'a'.repeat(PASSWORD_MIN - 1) }).errores
        .password,
    ).toContain(String(PASSWORD_MIN))
    expect(
      validarFormularioBarbero({ ...VALIDA, password: 'a'.repeat(PASSWORD_MIN) }).valido,
    ).toBe(true)
    expect(
      validarFormularioBarbero({ ...VALIDA, password: 'a'.repeat(PASSWORD_MAX) }).valido,
    ).toBe(true)
    expect(
      validarFormularioBarbero({ ...VALIDA, password: 'a'.repeat(PASSWORD_MAX + 1) }).errores
        .password,
    ).toContain(String(PASSWORD_MAX))
  })

  it('acumula todos los errores de una vez', () => {
    const resultado = validarFormularioBarbero({
      nombres: '',
      apellidos: '',
      nombreBarberia: 'a'.repeat(BARBERIA_MAX + 1),
      username: 'A B',
      correo: 'nope',
      password: '123',
    })

    expect(resultado.valido).toBe(false)
    expect(Object.keys(resultado.errores).sort()).toEqual([
      'apellidos',
      'correo',
      'nombreBarberia',
      'nombres',
      'password',
      'username',
    ])
  })

  it('acepta nombres con acentos y eñes', () => {
    const resultado = validarFormularioBarbero({
      ...VALIDA,
      nombres: 'Núñez',
      apellidos: 'Muñoz',
      nombreBarberia: 'Barbería Ñandú',
    })

    expect(resultado.valido).toBe(true)
    expect(resultado.cuerpo?.nombres).toBe('Núñez')
  })
})

describe('validarPassword', () => {
  it('exige contraseña y respeta 8–72', () => {
    expect(validarPassword('')).toContain('contraseña')
    expect(validarPassword('a'.repeat(7))).toContain('8')
    expect(validarPassword('a'.repeat(8))).toBeNull()
    expect(validarPassword('a'.repeat(72))).toBeNull()
    expect(validarPassword('a'.repeat(73))).toContain('72')
  })

  it('acepta la contraseña que genera el panel', () => {
    expect(validarPassword(generarPasswordProvisional())).toBeNull()
  })
})
