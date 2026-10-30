const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Vacío es válido porque el correo es opcional. */
export function esCorreoValido(correo: string): boolean {
  const limpio = correo.trim()
  if (limpio === '') return true
  return CORREO.test(limpio)
}

export function normalizarCorreo(correo: string): string | undefined {
  const limpio = correo.trim()
  return limpio === '' ? undefined : limpio
}
