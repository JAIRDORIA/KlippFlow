import { describe, expect, it } from 'vitest'
import type { SlotDisponibilidad } from '../types'
import {
  esSlotSeleccionable,
  etiquetaEstadoSlot,
  horaSigueDisponible,
  mapearEstadoSlot,
} from './horarios'

const SLOTS: SlotDisponibilidad[] = [
  {
    horaInicio: '09:00',
    horaFin: '09:45',
    estado: 'verde',
    minutosFueraDeHorario: 0,
  },
  {
    horaInicio: '09:15',
    horaFin: '10:00',
    estado: 'naranja',
    minutosFueraDeHorario: 0,
  },
  {
    horaInicio: '09:30',
    horaFin: '10:15',
    estado: 'rojo',
    minutosFueraDeHorario: 0,
  },
]

describe('estados de horarios', () => {
  it('mapea verde, naranja y rojo a estado visual', () => {
    expect(mapearEstadoSlot('verde')).toBe('libre')
    expect(mapearEstadoSlot('naranja')).toBe('por-confirmar')
    expect(mapearEstadoSlot('rojo')).toBe('ocupado')
  })

  it('solo los verdes son seleccionables', () => {
    expect(esSlotSeleccionable('verde')).toBe(true)
    expect(esSlotSeleccionable('naranja')).toBe(false)
    expect(esSlotSeleccionable('rojo')).toBe(false)
  })

  it('entrega etiquetas legibles', () => {
    expect(etiquetaEstadoSlot('verde')).toBe('Libre')
    expect(etiquetaEstadoSlot('naranja')).toBe('Por confirmar')
    expect(etiquetaEstadoSlot('rojo')).toBe('Ocupado')
  })

  it('solo mantiene una hora si sigue libre en la última consulta', () => {
    expect(horaSigueDisponible(SLOTS, '09:00')).toBe(true)
    expect(horaSigueDisponible(SLOTS, '09:15')).toBe(false)
    expect(horaSigueDisponible(SLOTS, '09:30')).toBe(false)
    expect(horaSigueDisponible(SLOTS, '10:00')).toBe(false)
    expect(horaSigueDisponible(SLOTS, null)).toBe(false)
  })
})
