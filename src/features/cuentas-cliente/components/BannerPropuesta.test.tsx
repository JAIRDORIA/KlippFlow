import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BannerPropuesta } from './BannerPropuesta'
import type { CitaClienteDetalle } from '../types'

const mocks = vi.hoisted(() => ({
  mostrarToast: vi.fn(),
  aceptar: vi.fn(),
  rechazar: vi.fn(),
}))

vi.mock('@/shared/ui/toast-context', () => ({
  useToast: () => ({ mostrarToast: mocks.mostrarToast }),
}))

vi.mock('../hooks', () => ({
  useAceptarCambioHora: () => ({ isPending: false, mutate: mocks.aceptar }),
  useRechazarCambioHora: () => ({ isPending: false, mutate: mocks.rechazar }),
}))

function minutosDesdeAhora(minutos: number): string {
  return new Date(Date.now() + minutos * 60_000).toISOString()
}

function cita(
  estado: CitaClienteDetalle['estado'],
  expiraEnMinutos = 45,
): CitaClienteDetalle {
  return {
    id: 42,
    estado,
    fecha: '2026-11-25',
    horaInicio: '15:30',
    horaFin: '16:00',
    barbero: { nombre: 'Ana', nombreBarberia: 'Barbería El Rey', codigo: 'BARB-0001' },
    numPersonas: 1,
    montoTotal: 25000,
    motivos: { motivoRechazo: null, motivoCancelacion: null },
    propuestaCambioHora: {
      fecha: '2026-11-26',
      horaInicio: '09:00',
      horaFin: '09:30',
      creadaEn: minutosDesdeAhora(-15),
      expiraEn: minutosDesdeAhora(expiraEnMinutos),
    },
    personas: [],
  }
}

describe('BannerPropuesta', () => {
  it('muestra la hora nueva, la anterior y las acciones', () => {
    render(<BannerPropuesta cita={cita('pendiente')} />)

    expect(screen.getByText('NUEVA HORA PROPUESTA')).toBeInTheDocument()
    expect(screen.getAllByText(/9:00 am – 9:30 am/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Antes:/)).toHaveTextContent('3:30 pm')
    expect(screen.getByText(/expira en/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument()
  })

  it('acepta la propuesta y avisa con un toast', () => {
    mocks.aceptar.mockImplementation(
      (_id: number, opciones: { onSuccess: () => void }) => opciones.onSuccess(),
    )

    render(<BannerPropuesta cita={cita('pendiente')} />)
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }))

    expect(mocks.aceptar).toHaveBeenCalledWith(42, expect.any(Object))
    expect(mocks.mostrarToast).toHaveBeenCalledWith(
      expect.objectContaining({ mensaje: 'Cita confirmada en la nueva hora.' }),
    )
  })

  it('al rechazar una pendiente avisa que quedó rechazada', () => {
    mocks.rechazar.mockImplementation(
      (_id: number, opciones: { onSuccess: () => void }) => opciones.onSuccess(),
    )

    render(<BannerPropuesta cita={cita('pendiente')} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))

    expect(mocks.mostrarToast).toHaveBeenCalledWith(
      expect.objectContaining({ mensaje: 'Tu solicitud quedó rechazada.' }),
    )
  })

  it('al rechazar una aceptada avisa que conserva su hora', () => {
    mocks.rechazar.mockImplementation(
      (_id: number, opciones: { onSuccess: () => void }) => opciones.onSuccess(),
    )

    render(<BannerPropuesta cita={cita('aceptada')} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))

    expect(mocks.mostrarToast).toHaveBeenCalledWith(
      expect.objectContaining({ mensaje: 'Mantienes tu hora original.' }),
    )
  })

  it('sin acciones cuando la propuesta ya venció y avisa una sola vez', () => {
    const onExpirada = vi.fn()
    render(<BannerPropuesta cita={cita('aceptada', -5)} onExpirada={onExpirada} />)

    expect(screen.queryByRole('button', { name: 'Aceptar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Rechazar' })).toBeNull()
    expect(screen.getByText('Propuesta expirada')).toBeInTheDocument()
    expect(onExpirada).toHaveBeenCalledTimes(1)
  })
})
