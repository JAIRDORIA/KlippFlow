import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { LoginPage } from '@/features/auth/LoginPage'
import { CompletarCuentaPage } from './CompletarCuentaPage'

beforeEach(() => {
  window.localStorage.clear()
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('CompletarCuentaPage', () => {
  it('si se recarga sin registro en memoria vuelve al login con aviso', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/registro/completar']}>
            <Routes>
              <Route path="/registro/completar" element={<CompletarCuentaPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText('Vuelve a continuar con Google'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument()
  })
})
