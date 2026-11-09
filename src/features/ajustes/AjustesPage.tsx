import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { TarjetaNotificaciones } from '@/features/notificaciones/components/TarjetaNotificaciones'
import { Button } from '@/shared/ui/Button'
import { ScreenHeader } from '@/shared/ui/ScreenHeader'
import { Sheet } from '@/shared/ui/Sheet'
import { SeccionHorarios } from './components/SeccionHorarios'
import { SeccionServicios } from './components/SeccionServicios'
import { TarjetaLink } from './components/TarjetaLink'
import { TarjetaWhatsapp } from './components/TarjetaWhatsapp'

/** Pantalla Ajustes (`/app/ajustes`), como DISENO.md 6.9. */
export function AjustesPage() {
  const { usuario, nombre, cerrarSesion } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [confirmando, setConfirmando] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nombreBarberia =
    usuario?.tipo === 'barbero' ? usuario.nombreBarberia : null
  const eyebrow =
    [nombre, nombreBarberia].filter(Boolean).join(' · ') || 'TU CUENTA'

  async function salir(): Promise<void> {
    if (saliendo) return

    setSaliendo(true)
    setError(null)

    try {
      await cerrarSesion()
      // Sin caché no queda nada del barbero anterior en memoria.
      queryClient.clear()
      navigate('/login', { replace: true })
    } catch {
      setError('No pudimos cerrar la sesión. Inténtalo de nuevo.')
      setSaliendo(false)
    }
  }

  return (
    <main className="screen screen-with-nav">
      <ScreenHeader eyebrow={eyebrow} titulo="Ajustes" />

      <TarjetaLink />
      <SeccionServicios />
      <SeccionHorarios />
      <TarjetaNotificaciones />
      <TarjetaWhatsapp />

      <section className="mt-9 pb-4">
        <Button
          variante="ghost"
          onClick={() => setConfirmando(true)}
          className="w-full"
        >
          Cerrar sesión
        </Button>
      </section>

      <Sheet
        abierto={confirmando}
        onCerrar={() => {
          if (!saliendo) setConfirmando(false)
        }}
        titulo="¿Cerrar sesión?"
        descripcion="Tendrás que volver a entrar con tu usuario y contraseña."
      >
        <div className="flex flex-col gap-2">
          {error && (
            <p role="alert" className="type-helper text-red">
              {error}
            </p>
          )}

          <Button
            variante="danger"
            onClick={() => void salir()}
            disabled={saliendo}
            aria-disabled={saliendo || undefined}
            cargando={saliendo}
            className="w-full"
          >
            Cerrar sesión
          </Button>
          <Button
            variante="ghost"
            onClick={() => setConfirmando(false)}
            disabled={saliendo}
            className="w-full"
          >
            Volver
          </Button>
        </div>
      </Sheet>
    </main>
  )
}
