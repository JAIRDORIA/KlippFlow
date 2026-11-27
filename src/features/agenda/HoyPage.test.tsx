import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { HoyPage } from './HoyPage'
import type { DashboardHoy } from './types'

const dashboard: DashboardHoy = {
  fecha: '2026-11-27',
  resumen: {
    citasHoy: 1,
    aceptadas: 0,
    atendidas: 0,
    noAsistio: 0,
    solicitudesPendientes: 0,
  },
  bloquesDeTrabajo: [{ horaInicio: '07:00', horaFin: '18:00' }],
  citas: [
    {
      id: 9,
      estado: 'cancelada',
      fecha: '2026-11-27',
      horaInicio: '10:00',
      horaFin: '10:30',
      cliente: { nombre: 'TEST-Ana', celular: '3001110001', correo: null },
      numPersonas: 1,
      montoTotal: 20000,
      personas: [
        {
          esTitular: true,
          nombre: 'TEST-Ana',
          duracionTotalMinutos: 30,
          servicios: [
            { nombre: 'Corte', precio: 20000, duracionMinutos: 30 },
          ],
        },
      ],
      minutosFueraHorario: 0,
      avisoDescanso: null,
      creadaEn: '2026-11-26T12:00:00.000Z',
      motivoCancelacion: 'Cancelada por el cliente',
    },
  ],
  // El backend libera el hueco al cancelarse la cita.
  huecosLibres: [{ horaInicio: '10:00', horaFin: '10:30' }],
}

vi.mock('@/features/agenda/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/agenda/hooks')>()
  return {
    ...actual,
    useDashboardHoy: () => ({
      data: dashboard,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    }),
  }
})

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ nombre: 'Barbero' }),
}))

function renderizarHoy() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <HoyPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('HoyPage con una cita cancelada', () => {
  it('la marca como cancelada y deja ver su horario como libre', () => {
    renderizarHoy()

    expect(screen.getByText('Cancelada')).toBeInTheDocument()
    expect(screen.getByText('Cancelada por el cliente')).toBeInTheDocument()

    const horarios = screen.getByRole('heading', { name: 'Horarios libres' })
      .parentElement
    expect(horarios).not.toBeNull()
    expect(within(horarios as HTMLElement).getByText(/10:00/)).toBeInTheDocument()
    expect(within(horarios as HTMLElement).getByText(/10:30/)).toBeInTheDocument()
  })
})
