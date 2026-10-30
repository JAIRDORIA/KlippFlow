import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthProvider'
import { LoginPage } from './LoginPage'

function renderizarLogin() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/app/hoy" element={<p>Hoy</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('LoginPage', () => {
  it('mantiene el botón Entrar desactivado hasta completar ambos campos', () => {
    renderizarLogin()

    const entrar = screen.getByRole('button', { name: 'Entrar' })
    expect(entrar).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Usuario'), {
      target: { value: 'barbero1' },
    })
    expect(entrar).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'Barbero2026' },
    })
    expect(entrar).toBeEnabled()
  })

  it('muestra y oculta la contraseña desde el toggle', () => {
    renderizarLogin()

    const campo = screen.getByLabelText('Contraseña')
    expect(campo).toHaveAttribute('type', 'password')

    const mostrar = screen.getByRole('button', { name: 'Mostrar contraseña' })
    expect(mostrar).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(mostrar)
    expect(campo).toHaveAttribute('type', 'text')
    expect(
      screen.getByRole('button', { name: 'Ocultar contraseña' }),
    ).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(campo).toHaveAttribute('type', 'password')
  })
})
