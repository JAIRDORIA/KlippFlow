import { describe, expect, it } from 'vitest'
import { textoEntrega } from './entrega'

const DATOS = {
  nombres: 'Ana',
  apellidos: 'Paz',
  username: 'ana.paz',
  password: 'contrasena-de-prueba',
  codigoUnico: 'K7M2P9QX',
  linkReservas: 'https://app.test/b/K7M2P9QX',
}

describe('textoEntrega', () => {
  it('incluye usuario, contraseña, código y link', () => {
    const texto = textoEntrega(DATOS)

    expect(texto).toContain('Ana Paz')
    expect(texto).toContain('ana.paz')
    expect(texto).toContain('contrasena-de-prueba')
    expect(texto).toContain('K7M2P9QX')
    expect(texto).toContain('https://app.test/b/K7M2P9QX')
    expect(texto).not.toContain('undefined')
  })

  it('omite la contraseña cuando no aplica', () => {
    const texto = textoEntrega({ ...DATOS, password: null })

    expect(texto).not.toContain('Contraseña:')
    expect(texto).toContain('ana.paz')
    expect(texto).toContain('K7M2P9QX')
  })

  it('funciona con nombres con acentos', () => {
    const texto = textoEntrega({ ...DATOS, nombres: 'Núñez', apellidos: 'Muñoz' })
    expect(texto).toContain('Núñez Muñoz')
  })
})
