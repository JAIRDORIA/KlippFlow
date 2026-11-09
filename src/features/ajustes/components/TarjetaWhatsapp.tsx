import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EstadoError } from '@/shared/ui/EstadoError'
import { Input } from '@/shared/ui/Input'
import { Skeleton } from '@/shared/ui/Skeleton'
import { Switch } from '@/shared/ui/Switch'
import { useToast } from '@/shared/ui/toast-context'
import { mensajeDeErrorAjustes } from '../domain/errores'
import {
  construirCuerpoWhatsapp,
  MENSAJE_ACTIVAR_SIN_CELULAR,
  puedeActivarWhatsapp,
  validarWhatsapp,
} from '../domain/whatsapp'
import { useActualizarWhatsapp, useConfiguracion } from '../hooks'
import type { ConfiguracionWhatsapp } from '../types'

/** Tarjeta "Recordatorios por WhatsApp" de Ajustes. */
export function TarjetaWhatsapp() {
  const { data, isPending, isError, isFetching, refetch } = useConfiguracion()
  const inicial = data?.whatsapp ?? null

  return (
    <section className="mt-9">
      <h2 className="type-card-title">Recordatorios por WhatsApp</h2>

      {isPending && <Skeleton className="mt-3 h-[232px] w-full" />}

      {isError && !data && (
        <div className="mt-3">
          <EstadoError
            mensaje="No pudimos cargar tu configuración de WhatsApp. Revisa tu conexión e inténtalo de nuevo."
            onReintentar={() => void refetch()}
            reintentando={isFetching}
          />
        </div>
      )}

      {inicial && (
        <FormularioWhatsapp
          key={`${inicial.celular ?? ''}:${inicial.activo}`}
          inicial={inicial}
        />
      )}
    </section>
  )
}

function FormularioWhatsapp({ inicial }: { inicial: ConfiguracionWhatsapp }) {
  const { mostrarToast } = useToast()
  const mutacion = useActualizarWhatsapp()

  const [celular, setCelular] = useState(inicial.celular ?? '')
  const [activo, setActivo] = useState(inicial.activo)
  const [tocado, setTocado] = useState(false)
  const [errorActivo, setErrorActivo] = useState<string | null>(null)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)

  const errores = validarWhatsapp(celular, activo)
  const cuerpo = construirCuerpoWhatsapp(celular, activo)
  const hayCambios =
    celular !== (inicial.celular ?? '') || activo !== inicial.activo

  function alternar(siguiente: boolean) {
    setErrorEnvio(null)

    if (siguiente && !puedeActivarWhatsapp(celular)) {
      setErrorActivo(MENSAJE_ACTIVAR_SIN_CELULAR)
      return
    }

    setErrorActivo(null)
    setActivo(siguiente)
  }

  function guardar() {
    if (!cuerpo || mutacion.isPending) return

    setErrorEnvio(null)
    mutacion.mutate(cuerpo, {
      onSuccess: (respuesta) => {
        setCelular(respuesta.whatsapp.celular ?? '')
        setActivo(respuesta.whatsapp.activo)
        setTocado(false)
        setErrorActivo(null)
        mostrarToast({
          mensaje: 'Recordatorios por WhatsApp guardados.',
          duracionMs: 4000,
        })
      },
      onError: (error) => {
        setErrorEnvio(mensajeDeErrorAjustes(error, 'whatsapp').mensaje)
      },
    })
  }

  const mensajeActivo = errores.activo ?? errorActivo

  return (
    <Card className="mt-3 flex flex-col gap-4">
      <p className="type-eyebrow">RECORDATORIOS DE TUS CITAS</p>

      <Input
        etiqueta="Celular"
        name="whatsapp-celular"
        value={celular}
        onChange={(evento) => {
          setCelular(evento.target.value)
          setErrorEnvio(null)
          setErrorActivo(null)
        }}
        onBlur={() => setTocado(true)}
        error={tocado || celular.length > 0 ? errores.celular : undefined}
        ayuda="Ejemplo 3001234567. Puedes escribir +57 y espacios."
        inputMode="tel"
        autoComplete="tel"
        maxLength={20}
        placeholder="3001234567"
        disabled={mutacion.isPending}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="type-form font-medium text-text">
            Recordatorios por WhatsApp
          </p>
          <p className="type-helper">
            Te avisaremos por WhatsApp 1 hora antes de cada cita aceptada.
          </p>
        </div>
        <Switch
          activo={activo}
          onCambio={alternar}
          etiqueta="Recordatorios por WhatsApp"
          disabled={mutacion.isPending}
        />
      </div>

      {mensajeActivo && (
        <p role="alert" className="type-helper text-red">
          {mensajeActivo}
        </p>
      )}

      {errorEnvio && (
        <p
          role="alert"
          className="type-small rounded-[var(--radius-warning)] border border-red-30 bg-red-10 p-[var(--space-warning)] text-red"
        >
          {errorEnvio}
        </p>
      )}

      <Button
        onClick={guardar}
        disabled={!cuerpo || !hayCambios || mutacion.isPending}
        cargando={mutacion.isPending}
        className="w-full"
      >
        Guardar
      </Button>
    </Card>
  )
}
