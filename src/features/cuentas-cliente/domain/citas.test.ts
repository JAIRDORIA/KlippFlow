import { describe, expect, it } from 'vitest'
import type { EstadoCita } from '@/features/reserva-publica/types'
import {
  citasDestacadas,
  etiquetaEstadoCita,
  fechaCitaLegible,
  horaCitaLegible,
  mensajeEstadoCita,
  motivoCancelacionLegible,
  motivoRechazoLegible,
  varianteEstadoCita,
} from './citas'
import type { CitaCliente, MotivosCitaCliente } from '../types'

const SIN_MOTIVOS: MotivosCitaCliente = {
  motivoRechazo: null,
  motivoCancelacion: null,
}

function cita(
  id: number,
  estado: EstadoCita,
  fecha: string,
  horaInicio = '10:00',
  horaFin = '10:30',
): CitaCliente {
  return {
    id,
    estado,
    fecha,
    horaInicio,
    horaFin,
    barbero: {
      nombre: 'Ana',
      nombreBarberia: 'Ana Barber',
      codigo: 'BARB-0001',
    },
    numPersonas: 1,
    montoTotal: 20000,
    motivos: SIN_MOTIVOS,
  }
}

describe('estado de cita', () => {
  it('traduce los siete estados y su variante', () => {
    const esperado: Record<EstadoCita, [string, string]> = {
      pendiente: ['Esperando respuesta', 'ambar'],
      aceptada: ['Aceptada', 'verde'],
      rechazada: ['No aceptada', 'rojo'],
      cancelada: ['Cancelada', 'rojo'],
      expirada: ['Sin respuesta', 'neutro'],
      atendida: ['Atendida', 'verde'],
      no_asistio: ['No asististe', 'neutro'],
    }

    for (const [estado, [etiqueta, variante]] of Object.entries(esperado)) {
      expect(etiquetaEstadoCita(estado as EstadoCita)).toBe(etiqueta)
      expect(varianteEstadoCita(estado as EstadoCita)).toBe(variante)
    }
  })

  it('genera un mensaje legible con el motivo de rechazo', () => {
    expect(
      mensajeEstadoCita('rechazada', {
        motivoRechazo: 'horario_ocupado',
        motivoCancelacion: null,
      }),
    ).toBe(
      'Tu solicitud no fue aceptada. Ese horario ya está ocupado. Puedes pedir otro.',
    )
    expect(mensajeEstadoCita('cancelada', SIN_MOTIVOS)).toBe(
      'Tu cita fue cancelada.',
    )
  })

  it('traduce motivos de rechazo y cancelación', () => {
    expect(motivoRechazoLegible('horario_ocupado')).toContain('horario ya está ocupado')
    expect(motivoRechazoLegible('no_disponible')).toContain('no está disponible')
    expect(motivoRechazoLegible('otro')).toContain('No fue posible aceptar')
    expect(motivoRechazoLegible(null)).toBeNull()
    expect(motivoCancelacionLegible('  se enfermó  ')).toBe('se enfermó')
    expect(motivoCancelacionLegible('   ')).toBeNull()
  })
})

describe('fecha y hora de la cita', () => {
  it('usa hoy/mañana y dd mmm con la medianoche de Bogotá', () => {
    const medianocheBogota = new Date('2026-11-05T05:00:00.000Z')
    const unMinutoAntes = new Date('2026-11-05T04:59:59.000Z')

    expect(fechaCitaLegible('2026-11-05', medianocheBogota)).toBe('Hoy')
    expect(fechaCitaLegible('2026-11-06', medianocheBogota)).toBe('Mañana')
    expect(fechaCitaLegible('2026-11-07', medianocheBogota)).toBe('7 nov')
    expect(fechaCitaLegible('2026-11-05', unMinutoAntes)).toBe('Mañana')
    expect(fechaCitaLegible('2026-11-03', medianocheBogota)).toBe('3 nov')
    expect(fechaCitaLegible('no-es-fecha', medianocheBogota)).toBe('')
  })

  it('formatea la hora en 12 h', () => {
    expect(horaCitaLegible('09:00')).toBe('9:00 am')
    expect(horaCitaLegible('15:30')).toBe('3:30 pm')
    expect(horaCitaLegible('00:00')).toBe('12:00 am')
    expect(horaCitaLegible('99:99')).toBe('')
  })
})

describe('citasDestacadas', () => {
  const referencia = new Date('2026-11-05T15:00:00.000Z') // 10:00 Bogotá

  it('pone pendientes primero y luego próximas aceptadas', () => {
    const resultado = citasDestacadas(
      [
        cita(1, 'aceptada', '2026-11-06'),
        cita(2, 'pendiente', '2026-11-08'),
        cita(3, 'aceptada', '2026-11-05', '11:00', '11:30'),
        cita(4, 'atendida', '2026-11-05'),
      ],
      referencia,
    )

    expect(resultado.map((item) => item.id)).toEqual([2, 3, 1])
  })

  it('excluye aceptadas ya terminadas y respeta el límite', () => {
    const resultado = citasDestacadas(
      [
        cita(1, 'aceptada', '2026-11-05', '08:00', '09:00'),
        cita(2, 'aceptada', '2026-11-06'),
        cita(3, 'aceptada', '2026-11-07'),
        cita(4, 'aceptada', '2026-11-08'),
        cita(5, 'pendiente', '2026-11-09'),
      ],
      referencia,
      3,
    )

    expect(resultado.map((item) => item.id)).toEqual([5, 2, 3])
  })
})
