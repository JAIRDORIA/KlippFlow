/**
 * Copiar al portapapeles con respaldo.
 *
 * `navigator.clipboard` no existe en contextos no seguros ni en algunos
 * navegadores embebidos; en ese caso se usa el textarea temporal clásico.
 * El entorno se inyecta para poder probarlo sin navegador.
 */

export interface EntornoPortapapeles {
  clipboard?: { writeText: (texto: string) => Promise<void> }
  document?: Document
  /** Permite simular `document.execCommand('copy')` en pruebas. */
  comandoCopiar?: (documento: Document) => boolean
}

export async function copiarAlPortapapeles(
  texto: string,
  entorno: EntornoPortapapeles = {},
): Promise<boolean> {
  const { clipboard, document: documento } = entorno

  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(texto)
      return true
    } catch {
      // Sigue al respaldo.
    }
  }

  if (!documento) return false

  const area = documento.createElement('textarea')
  area.value = texto
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.top = '0'
  area.style.left = '0'
  area.style.opacity = '0'
  documento.body.appendChild(area)

  let copiado: boolean
  try {
    area.select()
    copiado = entorno.comandoCopiar
      ? entorno.comandoCopiar(documento)
      : documento.execCommand('copy')
  } catch {
    copiado = false
  } finally {
    documento.body.removeChild(area)
  }

  return copiado
}
