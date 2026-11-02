import { describe, expect, it } from 'vitest'
import {
  esRutaNoIndex,
  normalizarRuta,
  tituloDeRuta,
  zonaDeRuta,
} from './rutas'

describe('normalizarRuta', () => {
  it('quita barras finales y deja / para la raíz', () => {
    expect(normalizarRuta('/app/hoy/')).toBe('/app/hoy')
    expect(normalizarRuta('/app/hoy///')).toBe('/app/hoy')
    expect(normalizarRuta('/')).toBe('/')
    expect(normalizarRuta('')).toBe('/')
  })
})

describe('zonaDeRuta', () => {
  it('asigna cada ruta a su zona', () => {
    expect(zonaDeRuta('/login')).toBe('barbero')
    expect(zonaDeRuta('/instalar')).toBe('barbero')
    expect(zonaDeRuta('/app')).toBe('barbero')
    expect(zonaDeRuta('/app/cuentas')).toBe('barbero')
    expect(zonaDeRuta('/b')).toBe('publico')
    expect(zonaDeRuta('/b/BARB-0001')).toBe('publico')
    expect(zonaDeRuta('/cita/abc123')).toBe('publico')
    expect(zonaDeRuta('/admin')).toBe('admin')
    expect(zonaDeRuta('/admin/login')).toBe('admin')
    expect(zonaDeRuta('/loquesea')).toBe('desconocida')
  })
})

describe('tituloDeRuta', () => {
  it('da el título de cada pantalla', () => {
    expect(tituloDeRuta('/')).toBe('KlippFlow')
    expect(tituloDeRuta('/login')).toBe('Entrar · KlippFlow')
    expect(tituloDeRuta('/instalar')).toBe('Instalar · KlippFlow')
    expect(tituloDeRuta('/app/instalar')).toBe('Instalar · KlippFlow')
    expect(tituloDeRuta('/app')).toBe('Hoy · KlippFlow')
    expect(tituloDeRuta('/app/hoy')).toBe('Hoy · KlippFlow')
    expect(tituloDeRuta('/app/solicitudes')).toBe('Solicitudes · KlippFlow')
    expect(tituloDeRuta('/app/cuentas')).toBe('Cuentas · KlippFlow')
    expect(tituloDeRuta('/app/compras')).toBe('Compras · KlippFlow')
    expect(tituloDeRuta('/app/ajustes')).toBe('Ajustes · KlippFlow')
    expect(tituloDeRuta('/admin')).toBe('Administración · KlippFlow')
    expect(tituloDeRuta('/admin/login')).toBe('Administración · KlippFlow')
    expect(tituloDeRuta('/b/BARB-0001')).toBe('Reservar cita · KlippFlow')
    expect(tituloDeRuta('/cita/token123')).toBe('Tu cita · KlippFlow')
    expect(tituloDeRuta('/loquesea')).toBe('No encontrada · KlippFlow')
    expect(tituloDeRuta('/app/xyz')).toBe('No encontrada · KlippFlow')
  })

  it('añade la barbería a la reserva pública cuando ya cargó', () => {
    expect(tituloDeRuta('/b/BARB-0001', { barberia: 'Ana Barber' })).toBe(
      'Reservar cita · Ana Barber · KlippFlow',
    )
    expect(tituloDeRuta('/b/BARB-0001', { barberia: '   ' })).toBe(
      'Reservar cita · KlippFlow',
    )
    expect(tituloDeRuta('/b/BARB-0001', { barberia: null })).toBe(
      'Reservar cita · KlippFlow',
    )
  })

  it('ignora la barbería en las demás rutas', () => {
    expect(tituloDeRuta('/app/hoy', { barberia: 'Ana Barber' })).toBe(
      'Hoy · KlippFlow',
    )
    expect(tituloDeRuta('/cita/token123', { barberia: 'Ana Barber' })).toBe(
      'Tu cita · KlippFlow',
    )
  })

  it('tolera barras finales', () => {
    expect(tituloDeRuta('/app/hoy/')).toBe('Hoy · KlippFlow')
    expect(tituloDeRuta('/admin/')).toBe('Administración · KlippFlow')
  })
})

describe('esRutaNoIndex', () => {
  it('marca noindex las privadas', () => {
    for (const ruta of [
      '/app',
      '/app/hoy',
      '/app/solicitudes',
      '/app/cuentas',
      '/app/compras',
      '/app/ajustes',
      '/admin',
      '/admin/login',
      '/login',
      '/instalar',
      '/app/instalar',
    ]) {
      expect(esRutaNoIndex(ruta), ruta).toBe(true)
    }
  })

  it('marca noindex las públicas de reserva y seguimiento', () => {
    expect(esRutaNoIndex('/b')).toBe(true)
    expect(esRutaNoIndex('/b/BARB-0001')).toBe(true)
    expect(esRutaNoIndex('/cita/token123')).toBe(true)
  })

  it('no marca rutas fuera de la app (el index.html ya las cubre)', () => {
    expect(esRutaNoIndex('/loquesea')).toBe(false)
  })
})
