import { Copy } from 'lucide-react'
import { copiarAlPortapapeles } from '@/shared/lib/portapapeles'
import { useConfiguracion } from '@/features/ajustes/hooks'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EstadoError } from '@/shared/ui/EstadoError'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useToast } from '@/shared/ui/toast-context'

/**
 * Tarjeta "TU LINK PÚBLICO DE RESERVAS" (DISENO.md 6.9).
 *
 * El link llega completo desde `GET /barbero/configuracion`; solo se muestra y
 * se copia (se quitó el atajo "Ver como cliente").
 */
export function TarjetaLink() {
  const { mostrarToast } = useToast()
  const { data, isPending, isError, isFetching, refetch } = useConfiguracion()

  async function copiar(link: string): Promise<void> {
    const copiado = await copiarAlPortapapeles(link, {
      clipboard:
        typeof navigator !== 'undefined' && navigator.clipboard
          ? { writeText: (texto) => navigator.clipboard.writeText(texto) }
          : undefined,
      document: typeof document !== 'undefined' ? document : undefined,
    })

    mostrarToast({
      mensaje: copiado
        ? 'Link copiado'
        : 'No pudimos copiar el link. Cópialo manualmente.',
      duracionMs: copiado ? 4000 : 6000,
    })
  }

  return (
    <section className="mt-7">
      <h2 className="type-card-title">Tu link público de reservas</h2>

      {isPending && <Skeleton className="mt-3 h-[132px] w-full" />}

      {isError && !data && (
        <div className="mt-3">
          <EstadoError
            mensaje="No pudimos cargar tu link. Revisa tu conexión e inténtalo de nuevo."
            onReintentar={() => void refetch()}
            reintentando={isFetching}
          />
        </div>
      )}

      {data && (
        <Card className="mt-3 flex flex-col gap-3">
          <p className="type-eyebrow">TU LINK PÚBLICO DE RESERVAS</p>
          <p className="type-small break-all font-mono text-text">
            {data.linkReservas}
          </p>

          <div className="mt-1 flex gap-2">
            <Button
              onClick={() => void copiar(data.linkReservas)}
              icono={<Copy aria-hidden="true" size={18} strokeWidth={1.6} />}
              className="w-full"
            >
              Copiar
            </Button>
          </div>
        </Card>
      )}
    </section>
  )
}
