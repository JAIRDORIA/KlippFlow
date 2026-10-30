import '@fontsource/instrument-sans/400.css'
import '@fontsource/instrument-sans/500.css'
import '@fontsource/instrument-sans/600.css'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { router } from './app/router'
import { AuthProvider } from './features/auth/AuthProvider'
import { ToastProvider } from './shared/ui/ToastProvider'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (evento: MessageEvent<unknown>) => {
    if (typeof evento.data !== 'object' || evento.data === null) return
    const datos = evento.data as Record<string, unknown>
    if (datos.tipo === 'klippflow:refrescar') {
      void queryClient.invalidateQueries()
    }
  })
}

// Registro propio y actualización automática (registerType: 'autoUpdate').
registerSW({ immediate: true })

const raiz = document.getElementById('root')
if (!raiz) {
  throw new Error('No se encontró el elemento #root')
}

createRoot(raiz).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <div className="app-shell">
            <RouterProvider router={router} />
          </div>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
