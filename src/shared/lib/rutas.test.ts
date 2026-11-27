import { describe, expect, it } from 'vitest'
import {
  esRutaDeBarbero,
  rutaInicialPorRol,
  volverClienteSeguro,
  volverSeguro,
} from './rutas'

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

  it('acepta el enlace profundo del panel del barbero', () => {
    expect(volverSeguro('/dashboard')).toBe('/dashboard')
    expect(volverSeguro('/dashboard?origen=whatsapp')).toBe(
      '/dashboard?origen=whatsapp',
    )
    expect(volverSeguro('/app')).toBe('/app')
    expect(volverSeguro('/app/hoy')).toBe('/app/hoy')
    expect(volverSeguro('/app/ajustes?seccion=whatsapp')).toBe(
      '/app/ajustes?seccion=whatsapp',
    )
    expect(volverSeguro('/instalar')).toBe('/instalar')
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
    expect(volverSeguro('/admin')).toBeNull()
    expect(volverSeguro('/admin/login')).toBeNull()
    expect(volverSeguro('/login')).toBeNull()
    expect(volverSeguro('/mi/../admin')).toBeNull()
    expect(volverSeguro('/mi/%2e%2e/admin')).toBeNull()
    expect(volverSeguro('/b/../admin')).toBeNull()
    expect(volverSeguro('/b')).toBeNull()
    expect(volverSeguro('/dashboard/../admin')).toBeNull()
    expect(volverSeguro('/app/../admin')).toBeNull()
  })
})

describe('esRutaDeBarbero', () => {
  it('reconoce el panel y sus alias', () => {
    expect(esRutaDeBarbero('/dashboard')).toBe(true)
    expect(esRutaDeBarbero('/dashboard?origen=whatsapp')).toBe(true)
    expect(esRutaDeBarbero('/dashboard/')).toBe(true)
    expect(esRutaDeBarbero('/app')).toBe(true)
    expect(esRutaDeBarbero('/app/hoy')).toBe(true)
    expect(esRutaDeBarbero('/instalar')).toBe(true)
  })

  it('no confunde rutas de cliente ni rutas externas', () => {
    expect(esRutaDeBarbero('/mi')).toBe(false)
    expect(esRutaDeBarbero('/b/BARB-0001')).toBe(false)
    expect(esRutaDeBarbero('/cita/token')).toBe(false)
    expect(esRutaDeBarbero('/admin')).toBe(false)
    expect(esRutaDeBarbero(null)).toBe(false)
  })
})

describe('volverClienteSeguro', () => {
  it('solo acepta la zona del cliente', () => {
    expect(volverClienteSeguro('/mi')).toBe('/mi')
    expect(volverClienteSeguro('/mi/citas/42')).toBe('/mi/citas/42')
    expect(volverClienteSeguro('/b/BARB-0001')).toBe('/b/BARB-0001')
    expect(volverClienteSeguro('/cita/token')).toBe('/cita/token')
  })

  it('rechaza el panel del barbero y rutas externas', () => {
    expect(volverClienteSeguro('/dashboard')).toBeNull()
    expect(volverClienteSeguro('/app/hoy')).toBeNull()
    expect(volverClienteSeguro('/admin')).toBeNull()
    expect(volverClienteSeguro('https://evil.example/mi')).toBeNull()
  })
})

describe('rutaInicialPorRol', () => {
  it('mapea barbero, cliente y sin sesión', () => {
    expect(rutaInicialPorRol('barbero')).toBe('/app')
    expect(rutaInicialPorRol('cliente')).toBe('/mi')
    expect(rutaInicialPorRol(null)).toBe('/login')
  })
})
