import { describe, expect, it } from 'vitest'
import type { EstadoCita } from '../types'
import {
  ESTADOS_SEGUIMIENTO,
  etiquetaMotivoRechazo,
  infoEstadoSeguimiento,
} from './seguimiento'

const ESTADOS: EstadoCita[] = [
  'pendiente',
  'aceptada',
  'rechazada',
  'cancelada',
  'expirada',
  'atendida',
  'no_asistio',
]

describe('estados del seguimiento', () => {
  it('define ícono, color y título para los siete estados', () => {
    expect(Object.keys(ESTADOS_SEGUIMIENTO)).toHaveLength(7)
    for (const estado of ESTADOS) {
      const info = infoEstadoSeguimiento(estado)
      expect(info.titulo.length).toBeGreaterThan(0)
      expect(['reloj', 'check', 'cruz', 'usuario-x']).toContain(info.icono)
      expect(['ambar', 'verde', 'rojo', 'gris']).toContain(info.color)
    }
  })

  it('respeta los colores principales del diseño', () => {
    expect(infoEstadoSeguimiento('pendiente')).toMatchObject({
      titulo: 'Cita creada',
      color: 'ambar',
      icono: 'reloj',
    })
    expect(infoEstadoSeguimiento('aceptada')).toMatchObject({
      titulo: 'Cita confirmada',
      color: 'verde',
      icono: 'check',
    })
    expect(infoEstadoSeguimiento('rechazada').color).toBe('rojo')
    expect(infoEstadoSeguimiento('cancelada').color).toBe('rojo')
    expect(infoEstadoSeguimiento('expirada').color).toBe('gris')
    expect(infoEstadoSeguimiento('no_asistio').color).toBe('gris')
  })

  it('traduce los motivos de rechazo documentados', () => {
    expect(etiquetaMotivoRechazo('horario_ocupado')).toBe('Horario ocupado')
    expect(etiquetaMotivoRechazo('no_disponible')).toBe('No disponible')
  })
})
