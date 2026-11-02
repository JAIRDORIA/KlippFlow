import { useCallback } from 'react'
import { copiarAlPortapapeles } from '@/shared/lib/portapapeles'
import { useToast } from '@/shared/ui/toast-context'

/** Copia al portapapeles con respaldo y avisa por toast. */
export function useCopiar() {
  const { mostrarToast } = useToast()

  return useCallback(
    async (texto: string, mensaje = 'Copiado') => {
      const copiado = await copiarAlPortapapeles(texto, {
        clipboard:
          typeof navigator !== 'undefined' && navigator.clipboard
            ? { writeText: (valor) => navigator.clipboard.writeText(valor) }
            : undefined,
        document: typeof document !== 'undefined' ? document : undefined,
      })

      mostrarToast({
        mensaje: copiado ? mensaje : 'No pudimos copiar. Cópialo manualmente.',
        duracionMs: copiado ? 3000 : 6000,
      })
    },
    [mostrarToast],
  )
}
