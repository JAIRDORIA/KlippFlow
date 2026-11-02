import { describe, expect, it } from 'vitest'
import { debeMostrarAvisoCita, debeOlvidarCita } from './avisoCita'

const HOY = '2026-10-30'

describe('debeMostrarAvisoCita', () => {
  it('sin datos no muestra nada', () => {
    expect(debeMostrarAvisoCita(null, HOY)).toBe(false)
    expect(debeMostrarAvisoCita(undefined, HOY)).toBe(false)
  })

  it('muestra la solicitud pendiente aunque sea de otro día', () => {
    expect(debeMostrarAvisoCita({ estado: 'pendiente', fecha: HOY }, HOY)).toBe(true)
    expect(debeMostrarAvisoCita({ estado: 'pendiente', fecha: '2026-10-28' }, HOY)).toBe(true)
  })

  it('muestra la cita aceptada de hoy o futura', () => {
    expect(debeMostrarAvisoCita({ estado: 'aceptada', fecha: HOY }, HOY)).toBe(true)
    expect(debeMostrarAvisoCita({ estado: 'aceptada', fecha: '2026-11-02' }, HOY)).toBe(true)
  })

  it('oculta la cita aceptada de un día ya pasado', () => {
    expect(debeMostrarAvisoCita({ estado: 'aceptada', fecha: '2026-10-29' }, HOY)).toBe(false)
  })

  it('oculta todos los estados finales', () => {
    for (const estado of ['atendida', 'no_asistio', 'cancelada', 'rechazada', 'expirada']) {
      expect(debeMostrarAvisoCita({ estado, fecha: HOY }, HOY)).toBe(false)
      expect(debeMostrarAvisoCita({ estado, fecha: '2026-12-01' }, HOY)).toBe(false)
    }
  })

  it('oculta estados desconocidos o vacíos', () => {
    expect(debeMostrarAvisoCita({ estado: 'loquesea', fecha: HOY }, HOY)).toBe(false)
    expect(debeMostrarAvisoCita({ estado: '', fecha: HOY }, HOY)).toBe(false)
    expect(debeMostrarAvisoCita({ estado: 'aceptada', fecha: '' }, HOY)).toBe(false)
  })

  it('cruza el cambio de mes y de año sin sorpresas', () => {
    expect(debeMostrarAvisoCita({ estado: 'aceptada', fecha: '2026-11-01' }, '2026-10-31')).toBe(true)
    expect(debeMostrarAvisoCita({ estado: 'aceptada', fecha: '2026-12-31' }, '2027-01-01')).toBe(false)
    expect(debeMostrarAvisoCita({ estado: 'aceptada', fecha: '2027-01-01' }, '2027-01-01')).toBe(true)
  })
})

describe('debeOlvidarCita', () => {
  it('olvida lo que ya no se muestra', () => {
    expect(debeOlvidarCita({ estado: 'atendida', fecha: HOY }, HOY)).toBe(true)
    expect(debeOlvidarCita({ estado: 'aceptada', fecha: '2026-10-01' }, HOY)).toBe(true)
    expect(debeOlvidarCita({ estado: 'cancelada', fecha: '2026-11-05' }, HOY)).toBe(true)
  })

  it('conserva lo que sigue vivo o cuando no hay datos', () => {
    expect(debeOlvidarCita({ estado: 'pendiente', fecha: HOY }, HOY)).toBe(false)
    expect(debeOlvidarCita({ estado: 'aceptada', fecha: HOY }, HOY)).toBe(false)
    expect(debeOlvidarCita(null, HOY)).toBe(false)
  })
})
