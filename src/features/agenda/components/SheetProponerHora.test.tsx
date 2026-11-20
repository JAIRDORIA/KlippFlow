import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { hoyBogota } from '@/shared/lib/fechas'
import type { CitaBarbero } from '../types'
import { SheetProponerHora } from './SheetProponerHora'

const mocks = vi.hoisted(() => ({
  mostrarToast: vi.fn(),
  proponer: vi.fn(),
}))

vi.mock('@/shared/ui/toast-context', () => ({
  useToast: () => ({ mostrarToast: mocks.mostrarToast }),
}))

vi.mock('../hooks', () => ({
  useDisponibilidadCambioHora: () => ({
    isPending: false,
    isError: false,
    data: {
      fecha: hoyBogota(),
      duracionMinutos: 30,
      cuadriculaMinutos: 15,
      slots: [
        { horaInicio: '09:00', horaFin: '09:30', estado: 'verde', minutosFueraHorario: 0 },
        { horaInicio: '09:15', horaFin: '09:45', estado: 'naranja', minutosFueraHorario: 0 },
        { horaInicio: '09:30', horaFin: '10:00', estado: 'rojo', minutosFueraHorario: 0 },
      ],
    },
    refetch: vi.fn(),
  }),
  useProponerCambioHora: () => ({ isPending: false, mutate: mocks.proponer }),
}))

function cita(): CitaBarbero {
  return {
    id: 7,
    estado: 'aceptada',
    fecha: hoyBogota(),
    horaInicio: '15:30',
    horaFin: '16:00',
    cliente: { nombre: 'Camila', celular: '3001112233', correo: null },
    numPersonas: 1,
    montoTotal: 25000,
    personas: [],
    minutosFueraHorario: 0,
    avisoDescanso: null,
    creadaEn: new Date().toISOString(),
    propuestaCambioHora: null,
  }
}

describe('SheetProponerHora', () => {
  it('solo deja elegir los slots verdes', () => {
    render(<SheetProponerHora cita={cita()} onCerrar={() => undefined} />)

    const libre = screen.getByRole('button', { name: /9:00 am, Libre/ })
    expect(libre).not.toHaveAttribute('aria-disabled')
    expect(
      screen.getByRole('button', { name: /9:15 am, Por confirmar/ }),
    ).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: /9:30 am, Ocupado/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: /9:15 am, Por confirmar/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Proponer esta hora' }))

    expect(mocks.proponer).not.toHaveBeenCalled()
  })

  it('propone la hora elegida y ofrece avisar por WhatsApp', () => {
    mocks.proponer.mockImplementation(
      (
        _variables: unknown,
        opciones: { onSuccess: (respuesta: { whatsappUrl?: string }) => void },
      ) => opciones.onSuccess({ whatsappUrl: 'https://wa.me/573001112233' }),
    )
    const onCerrar = vi.fn()

    render(<SheetProponerHora cita={cita()} onCerrar={onCerrar} />)

    fireEvent.click(screen.getByRole('button', { name: /9:00 am, Libre/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Proponer esta hora' }))

    expect(mocks.proponer).toHaveBeenCalledWith(
      { id: 7, fecha: hoyBogota(), horaInicio: '09:00' },
      expect.any(Object),
    )
    expect(mocks.mostrarToast).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: { etiqueta: 'Avisar', href: 'https://wa.me/573001112233' },
      }),
    )
    expect(onCerrar).toHaveBeenCalled()
  })

  it('avisa que la nueva propuesta reemplaza la vigente', () => {
    const conPropuesta = cita()
    conPropuesta.propuestaCambioHora = {
      fecha: hoyBogota(),
      horaInicio: '18:00',
      horaFin: '18:30',
      creadaEn: new Date().toISOString(),
      expiraEn: new Date(Date.now() + 30 * 60_000).toISOString(),
    }

    render(<SheetProponerHora cita={conPropuesta} onCerrar={() => undefined} />)

    expect(screen.getByText(/reemplaza la anterior/)).toBeInTheDocument()
  })
})
