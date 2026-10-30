/** Copia con Clipboard API y cae al método clásico si no está disponible. */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(texto)
      return true
    }
  } catch {
    // Se intenta el fallback.
  }

  try {
    const area = document.createElement('textarea')
    area.value = texto
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const copiado = document.execCommand('copy')
    document.body.removeChild(area)
    return copiado
  } catch {
    return false
  }
}
