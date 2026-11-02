/**
 * Contraseña provisional para un barbero nuevo.
 *
 * El backend **no** genera la contraseña (`ADMIN.md` §4): la escribe el admin,
 * así que el panel puede proponer una con `crypto.getRandomValues`.
 *
 * Reglas del backend: 8–72 caracteres. Reglas de esta app: 12 caracteres, sin
 * ambiguos (0/O, 1/l/I), con al menos una mayúscula, una minúscula y un dígito.
 */

export const LONGITUD_PASSWORD_PROVISIONAL = 12

export const MAYUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
export const MINUSCULAS = 'abcdefghijkmnopqrstuvwxyz'
export const DIGITOS = '23456789'
export const ALFABETO = `${MAYUSCULAS}${MINUSCULAS}${DIGITOS}`

/** Caracteres que no deben aparecer (se confunden al dictarlos). */
export const AMBIGUOS = '0O1lI'

export type FuenteAleatoria = (
  destino: Uint8Array<ArrayBuffer>,
) => Uint8Array<ArrayBuffer>

const aleatorioDelNavegador: FuenteAleatoria = (destino) =>
  crypto.getRandomValues(destino)

/**
 * Entero uniforme en `[0, max)` sin sesgo de módulo: se descartan los bytes que
 * caen en el tramo sobrante (256 % max).
 */
function indiceAleatorio(max: number, aleatorio: FuenteAleatoria): number {
  if (max <= 0) return 0

  const limite = 256 - (256 % max)
  const buffer = new Uint8Array(new ArrayBuffer(1))

  for (let intento = 0; intento < 256; intento += 1) {
    aleatorio(buffer)
    const valor = buffer[0] ?? 0
    if (valor < limite) return valor % max
  }

  // Fuente aleatoria degenerada: no se bloquea la UI.
  return max - 1
}

function caracterDe(grupo: string, aleatorio: FuenteAleatoria): string {
  const indice = indiceAleatorio(grupo.length, aleatorio)
  return grupo[indice] ?? grupo[0] ?? ''
}

/** Mezcla Fisher–Yates con la misma fuente aleatoria. */
function mezclar(caracteres: string[], aleatorio: FuenteAleatoria): void {
  for (let indice = caracteres.length - 1; indice > 0; indice -= 1) {
    const destino = indiceAleatorio(indice + 1, aleatorio)
    const actual = caracteres[indice]
    const otro = caracteres[destino]

    if (actual === undefined || otro === undefined) continue

    caracteres[indice] = otro
    caracteres[destino] = actual
  }
}

export function generarPasswordProvisional(
  longitud: number = LONGITUD_PASSWORD_PROVISIONAL,
  aleatorio: FuenteAleatoria = aleatorioDelNavegador,
): string {
  if (!Number.isInteger(longitud) || longitud < 3) {
    throw new Error('La contraseña provisional necesita al menos 3 caracteres.')
  }

  const caracteres: string[] = [
    caracterDe(MAYUSCULAS, aleatorio),
    caracterDe(MINUSCULAS, aleatorio),
    caracterDe(DIGITOS, aleatorio),
  ]

  while (caracteres.length < longitud) {
    caracteres.push(caracterDe(ALFABETO, aleatorio))
  }

  mezclar(caracteres, aleatorio)
  return caracteres.join('')
}

/** ¿Cumple las reglas que promete el panel? (se usa en pruebas y validación) */
export function passwordProvisionalValida(valor: string): boolean {
  if (valor.length !== LONGITUD_PASSWORD_PROVISIONAL) return false
  if (!/[A-Z]/.test(valor) || !/[a-z]/.test(valor) || !/[0-9]/.test(valor)) return false
  return ![...AMBIGUOS].some((ambiguo) => valor.includes(ambiguo))
}
