import { describe, expect, it } from 'vitest'
import { rutaInicialPorRol, volverSeguro } from './rutas'

describe('volverSeguro', () => {
  it('acepta rutas internas permitidas', () => {
    expect(volverSeguro('/b/BARB-0001')).toBe('/b/BARB-0001')
    expect(volverSeguro('/b/BARB-0001?tab=servicios')).toBe(
      '/b/BARB-0001?tab=servicios',
    )
    expect(volverSeguro('/cita/a23774')).toBe('/cita/a23774')
    expect(volverSeguro('/mi')).toBe('/mi')
    expect(volverSeguro('/mi/nueva-contrasena')).toBe('/mi/nueva-contrasena')
    expect(volverSeguro('  /mi  ')).toBe('/mi')
  })

  it('rechaza rutas externas, protocolos y barras dobles', () => {
    expect(volverSeguro(null)).toBeNull()
    expect(volverSeguro(undefined)).toBeNull()
    expect(volverSeguro('')).toBeNull()
    expect(volverSeguro('/')).toBeNull()
    expect(volverSeguro('b/BARB-0001')).toBeNull()
    expect(volverSeguro('//evil.example')).toBeNull()
    expect(volverSeguro('https://evil.example')).toBeNull()
    expect(volverSeguro('http://evil.example')).toBeNull()
    expect(volverSeguro('/\\evil.example')).toBeNull()
    expect(volverSeguro('\\evil.example')).toBeNull()
  })

  it('rechaza saltos de línea y caracteres de control', () => {
    expect(volverSeguro('/b/BARB-0001\n')).toBeNull()
    expect(volverSeguro('/mi\r\n')).toBeNull()
    expect(volverSeguro('/mi\u0000')).toBeNull()
    expect(volverSeguro('/b/%0A')).toBeNull()
  })

  it('rechaza rutas no permitidas y travesías', () => {
    expect(volverSeguro('/app')).toBeNull()
    expect(volverSeguro('/app/hoy')).toBeNull()
    expect(volverSeguro('/admin')).toBeNull()
    expect(volverSeguro('/login')).toBeNull()
    expect(volverSeguro('/mi/../admin')).toBeNull()
    expect(volverSeguro('/mi/%2e%2e/admin')).toBeNull()
    expect(volverSeguro('/b/../admin')).toBeNull()
    expect(volverSeguro('/b')).toBeNull()
  })
})

describe('rutaInicialPorRol', () => {
  it('mapea barbero, cliente y sin sesión', () => {
    expect(rutaInicialPorRol('barbero')).toBe('/app')
    expect(rutaInicialPorRol('cliente')).toBe('/mi')
    expect(rutaInicialPorRol(null)).toBe('/login')
  })
})
