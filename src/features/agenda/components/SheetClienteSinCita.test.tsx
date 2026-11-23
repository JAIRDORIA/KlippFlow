import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorPeticion } from '@/shared/api/client'
import type { ServicioSinCita } from '../types'
import { SheetClienteSinCita } from './SheetClienteSinCita'

const mocks = vi.hoisted(() => ({
  mostrarToast: vi.fn(),
  registrar: vi.fn(),
}))

vi.mock('@/shared/ui/toast-context', () => ({
  useToast: () => ({ mostrarToast: mocks.mostrarToast }),
}))

const catalogo: ServicioSinCita[] = [
  {
    id: 1,
    nombre: 'Corte',
    descripcion: null,
    precio: 20000,
    duracionMinutos: 30,
    activo: true,
  },
  {
    id: 2,
    nombre: 'Barba',
    descripcion: null,
    precio: 5000,
    duracionMinutos: 10,
    activo: true,
  },
]

vi.mock('../hooks', () => ({
  useServiciosActivos: () => ({
    data: catalogo,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
  useRegistrarServicioSinCita: () => ({ isPending: false, mutate: mocks.registrar }),
}))

// El Sheet monta un portal y bloquea el scroll del body: con la suite en
// paralelo el render puede rozar el límite por defecto de 5 s.
vi.setConfig({ testTimeout: 15_000 })

function abrir() {
  const onCerrar = vi.fn()
  render(<SheetClienteSinCita abierto onCerrar={onCerrar} />)
  return onCerrar
}

function elegir(nombre: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(nombre) }))
}

describe('SheetClienteSinCita', () => {
  beforeEach(() => {
    mocks.mostrarToast.mockReset()
    mocks.registrar.mockReset()
  })

  it('no registra sin servicios y explica el motivo', () => {
    abrir()

    fireEvent.click(screen.getByRole('button', { name: 'Registrar cobro' }))

    expect(mocks.registrar).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Elige al menos un servicio.')
  })

  it('registra «Ya lo atendí» con el total del catálogo y sin propina', () => {
    mocks.registrar.mockImplementation(
      (_cuerpo: unknown, opciones: { onSuccess: () => void }) => opciones.onSuccess(),
    )
    const onCerrar = abrir()

    elegir('Corte')
    elegir('Barba')
    expect(screen.getByText('2 servicios · 40 min')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Registrar cobro' }))

    // Sin propina y con el monto intacto no se envían esos campos.
    expect(mocks.registrar).toHaveBeenCalledWith(
      { modo: 'atendido', servicioIds: [1, 2] },
      expect.any(Object),
    )
    expect(mocks.mostrarToast).toHaveBeenCalledWith(
      expect.objectContaining({ mensaje: 'Servicio registrado.' }),
    )
    expect(onCerrar).toHaveBeenCalled()
  })

  it('envía el monto cobrado cuando el barbero lo cambia', () => {
    abrir()

    elegir('Corte')
    fireEvent.change(screen.getByLabelText('Monto cobrado'), {
      target: { value: '18000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar cobro' }))

    expect(mocks.registrar).toHaveBeenCalledWith(
      { modo: 'atendido', servicioIds: [1], montoCobrado: 18000 },
      expect.any(Object),
    )
  })

  it('registra «Empezar ahora» sin propina aunque se haya escrito', () => {
    abrir()

    elegir('Corte')
    fireEvent.click(screen.getByRole('radio', { name: 'Sí' }))
    fireEvent.change(screen.getByLabelText('Propina'), { target: { value: '3000' } })

    fireEvent.click(screen.getByRole('radio', { name: 'Empezar ahora' }))

    expect(screen.queryByText('¿Dejó propina?')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Empezar ahora' }))

    expect(mocks.registrar).toHaveBeenCalledWith(
      { modo: 'en_curso', servicioIds: [1] },
      expect.any(Object),
    )
  })

  it('no registra con «Sí» y la propina vacía', () => {
    abrir()

    elegir('Corte')
    fireEvent.click(screen.getByRole('radio', { name: 'Sí' }))
    fireEvent.click(screen.getByRole('button', { name: 'Registrar cobro' }))

    expect(mocks.registrar).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Propina')).toHaveAttribute('aria-invalid', 'true')
  })

  it('adjunta propina y datos del cliente en «Ya lo atendí»', () => {
    abrir()

    elegir('Corte')
    fireEvent.click(screen.getByRole('radio', { name: 'Sí' }))
    fireEvent.change(screen.getByLabelText('Propina'), { target: { value: '2000' } })

    fireEvent.click(screen.getByRole('button', { name: /Nombre y celular/ }))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Pedro' } })
    fireEvent.change(screen.getByLabelText('Celular'), {
      target: { value: '+57 300 111 2233' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Registrar cobro' }))

    expect(mocks.registrar).toHaveBeenCalledWith(
      {
        modo: 'atendido',
        servicioIds: [1],
        montoPropina: 2000,
        clienteNombre: 'Pedro',
        clienteCelular: '3001112233',
      },
      expect.any(Object),
    )
  })

  it('muestra el 409 de cruce tal cual y sugiere «Ya lo atendí»', () => {
    mocks.registrar.mockImplementation(
      (_cuerpo: unknown, opciones: { onError: (fallo: ErrorPeticion) => void }) =>
        opciones.onError(
          new ErrorPeticion({
            status: 409,
            mensaje: 'Se cruza con la cita aceptada de las 10:00',
          }),
        ),
    )
    abrir()

    elegir('Corte')
    fireEvent.click(screen.getByRole('radio', { name: 'Empezar ahora' }))
    fireEvent.click(screen.getByRole('button', { name: 'Empezar ahora' }))

    expect(
      screen.getByText('Se cruza con la cita aceptada de las 10:00'),
    ).toBeInTheDocument()
    expect(screen.getByText(/regístralo con «Ya lo atendí»/)).toBeInTheDocument()
  })

  it('avisa cuando el celular no es válido y muestra el campo', () => {
    abrir()

    elegir('Corte')
    fireEvent.click(screen.getByRole('button', { name: /Nombre y celular/ }))
    fireEvent.change(screen.getByLabelText('Celular'), { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: /Nombre y celular/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Registrar cobro' }))

    expect(mocks.registrar).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Celular')).toBeInTheDocument()
    expect(screen.getByLabelText('Celular')).toHaveAttribute('aria-invalid', 'true')
  })
})
