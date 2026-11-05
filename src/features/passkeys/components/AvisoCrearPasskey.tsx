import { useState } from 'react'
import { useToast } from '@/shared/ui/toast-context'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import {
  mapearErrorPasskey,
  nombreSugeridoDispositivo,
} from '../domain/passkeys'
import {
  descarteCreacionVigente,
  guardarDescarteCreacion,
  leerMarcaPasskey,
} from '../domain/marca'
import { useAutenticadorPlataforma, useRegistrarPasskey } from '../hooks'

/**
 * Oferta de creación en /mi. Solo aparece si el dispositivo soporta WebAuthn,
 * tiene autenticador de plataforma, no tiene la marca y no se descartó 30 días.
 */
export function AvisoCrearPasskey() {
  const plataforma = useAutenticadorPlataforma()
  const registrar = useRegistrarPasskey()
  const { mostrarToast } = useToast()
  const [oculto, setOculto] = useState(
    () => leerMarcaPasskey() || descarteCreacionVigente(),
  )
  const [creada, setCreada] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (oculto || creada || plataforma !== true) return null

  function crear() {
    setError(null)
    registrar.mutate(
      { nombre: nombreSugeridoDispositivo() },
      {
        onSuccess: () => {
          setCreada(true)
          mostrarToast({
            mensaje: 'Listo, la próxima vez entra con tu huella o PIN',
          })
        },
        onError: (fallo) => {
          const mapeado = mapearErrorPasskey(fallo, 'registro')
          if (!mapeado.silencioso) setError(mapeado.mensaje)
        },
      },
    )
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="type-card-title">
          Entra más rápido con tu huella, rostro o PIN
        </p>
        <p className="type-small mt-2 text-secondary">
          Crea una passkey en este dispositivo y olvídate de escribir la
          contraseña.
        </p>
      </div>

      <Button
        onClick={crear}
        disabled={registrar.isPending}
        aria-disabled={registrar.isPending || undefined}
        cargando={registrar.isPending}
        className="w-full"
      >
        Crear passkey
      </Button>

      <div aria-live="polite" className="min-h-0">
        {registrar.isPending && (
          <p className="type-helper text-secondary">Creando passkey…</p>
        )}
        {error && (
          <p role="alert" className="type-helper text-red">
            {error}
          </p>
        )}
      </div>

      <Button
        variante="ghost"
        tamano="compacto"
        onClick={() => {
          guardarDescarteCreacion()
          setOculto(true)
        }}
      >
        Ahora no
      </Button>
    </Card>
  )
}
