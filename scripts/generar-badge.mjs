/**
 * Genera `public/icons/badge-96.png` para las notificaciones push.
 *
 * Android usa el `badge` como máscara de alfa: pinta de blanco todo lo que sea
 * opaco y descarta el color. Por eso el badge debe ser **blanco puro con
 * transparencia** (la forma en el canal alfa, el fondo transparente). Un PNG a
 * color con fondo opaco sale como un cuadrado blanco.
 *
 * Fuente: `public/icons/logo-512.png`.
 * - Si el logo tiene fondo transparente, se usa su alfa tal cual.
 * - Si tuviera fondo opaco, el alfa se deriva de la luminosidad (oscuro =
 *   forma visible) y se descarta el fondo.
 *
 * Salida: 96×96, RGB blanco, alfa con la forma, margen interno del 10 %.
 *
 * Uso: `pnpm badge` (una sola vez; el PNG se versiona).
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const RAIZ = process.cwd()
const ORIGEN = path.join(RAIZ, 'public', 'icons', 'logo-512.png')
const DESTINO = path.join(RAIZ, 'public', 'icons', 'badge-96.png')

const LADO = 96
const MARGEN = 0.1
const CONTENIDO = Math.round(LADO * (1 - 2 * MARGEN)) // 77 px
/** Por debajo de este alfa se considera fondo (sombra/antialias tenue). */
const UMBRAL_FONDO = 16

/** Mapa de grises (1 canal) a partir del alfa del logo. */
async function leerMascara() {
  const { data, info } = await sharp(ORIGEN)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const total = width * height
  const mascara = Buffer.alloc(total)
  let alfaMin = 255
  let alfaMax = 0
  for (let i = 0; i < total; i++) {
    const alfa = data[i * channels + 3]
    if (alfa < alfaMin) alfaMin = alfa
    if (alfa > alfaMax) alfaMax = alfa
  }

  const usaAlfa = alfaMin < 255 && alfaMax > 0

  for (let i = 0; i < total; i++) {
    let valor
    if (usaAlfa) {
      valor = data[i * channels + 3]
    } else {
      // Sin transparencia: el fondo suele ser claro y la forma oscura.
      const r = data[i * channels]
      const g = data[i * channels + 1]
      const b = data[i * channels + 2]
      const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b
      valor = 255 - luminancia
    }

    // Fondo totalmente transparente; el antialias se conserva.
    valor = valor < UMBRAL_FONDO ? 0 : Math.round(((valor - UMBRAL_FONDO) * 255) / (255 - UMBRAL_FONDO))
    mascara[i] = valor
  }

  let x0 = width
  let y0 = height
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mascara[y * width + x] === 0) continue
      if (x < x0) x0 = x
      if (y < y0) y0 = y
      if (x > x1) x1 = x
      if (y > y1) y1 = y
    }
  }

  if (x1 < x0 || y1 < y0) {
    throw new Error('El logo no tiene píxeles visibles: no se puede generar el badge.')
  }

  return {
    mascara,
    width,
    height,
    origen: usaAlfa ? 'alfa del PNG (fondo transparente)' : 'luminosidad invertida (fondo opaco)',
    recorte: { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 },
  }
}

/** Centra la máscara recortada en un lienzo de 96×96 con margen del 10 %. */
async function componerMascara({ mascara, width, height, recorte }) {
  const { data, info } = await sharp(mascara, {
    raw: { width, height, channels: 1 },
  })
    .extract(recorte)
    .resize({ width: CONTENIDO, height: CONTENIDO, fit: 'inside', kernel: 'lanczos3' })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const lienzo = Buffer.alloc(LADO * LADO)
  const offsetX = Math.round((LADO - info.width) / 2)
  const offsetY = Math.round((LADO - info.height) / 2)
  const canales = info.channels

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      // `sharp` puede devolver la máscara en 1 o 3 canales según la versión:
      // se toma el primer canal con el paso real de la imagen.
      lienzo[(y + offsetY) * LADO + (x + offsetX)] = data[(y * info.width + x) * canales]
    }
  }

  return { lienzo, anchoForma: info.width, altoForma: info.height, offsetX, offsetY }
}

/** RGBA: RGB blanco puro y el alfa de la forma. */
function aRgbaBlanco(alfa) {
  const rgba = Buffer.alloc(LADO * LADO * 4)
  for (let i = 0; i < LADO * LADO; i++) {
    rgba[i * 4] = 255
    rgba[i * 4 + 1] = 255
    rgba[i * 4 + 2] = 255
    rgba[i * 4 + 3] = alfa[i]
  }
  return rgba
}

/** Comprueba el PNG final y devuelve estadísticas legibles. */
async function verificar() {
  const { data, info } = await sharp(DESTINO)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  if (info.width !== LADO || info.height !== LADO) {
    throw new Error(`Tamaño incorrecto: ${info.width}×${info.height}`)
  }
  if (info.channels !== 4) {
    throw new Error(`El PNG no es RGBA (${info.channels} canales)`)
  }

  let alfaMin = 255
  let alfaMax = 0
  let alfaSuma = 0
  let transparentes = 0
  let opacos = 0
  let parciales = 0
  let rgbNoBlanco = 0
  let x0 = LADO
  let y0 = LADO
  let x1 = -1
  let y1 = -1

  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      const i = (y * LADO + x) * 4
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
      if (r !== 255 || g !== 255 || b !== 255) rgbNoBlanco++
      if (a < alfaMin) alfaMin = a
      if (a > alfaMax) alfaMax = a
      alfaSuma += a
      if (a === 0) transparentes++
      else if (a === 255) opacos++
      else parciales++
      if (a > 0) {
        if (x < x0) x0 = x
        if (y < y0) y0 = y
        if (x > x1) x1 = x
        if (y > y1) y1 = y
      }
    }
  }

  const total = LADO * LADO
  if (rgbNoBlanco > 0) throw new Error(`Hay ${rgbNoBlanco} píxeles que no son blancos`)
  if (alfaMax === 0) throw new Error('El badge está 100 % transparente')
  if (alfaMin === 255) throw new Error('El badge está 100 % opaco (sin transparencia)')

  return {
    ancho: info.width,
    alto: info.height,
    canales: info.channels,
    alfaMin,
    alfaMax,
    alfaMedia: Number((alfaSuma / total).toFixed(1)),
    transparentes,
    opacos,
    parciales,
    rgbNoBlanco,
    cajaAlfa: { x0, y0, x1, y1 },
  }
}

/** Vista ASCII para comprobar de un vistazo que se ve la forma. */
function vistaAscii(alfa) {
  const filas = 24
  const columnas = 24
  const bloque = LADO / columnas
  const rampa = ' .:-=+*#%@'
  const lineas = []
  for (let fy = 0; fy < filas; fy++) {
    let linea = ''
    for (let fx = 0; fx < columnas; fx++) {
      let suma = 0
      let cuenta = 0
      for (let y = Math.floor(fy * bloque); y < Math.floor((fy + 1) * bloque); y++) {
        for (let x = Math.floor(fx * bloque); x < Math.floor((fx + 1) * bloque); x++) {
          suma += alfa[y * LADO + x]
          cuenta++
        }
      }
      const promedio = suma / cuenta
      linea += rampa[Math.min(rampa.length - 1, Math.floor((promedio / 255) * (rampa.length - 1)))]
    }
    lineas.push(linea)
  }
  return lineas.join('\n')
}

const mascara = await leerMascara()
const forma = await componerMascara(mascara)
const rgba = aRgbaBlanco(forma.lienzo)

await mkdir(path.dirname(DESTINO), { recursive: true })
await sharp(rgba, { raw: { width: LADO, height: LADO, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(DESTINO)

const stats = await verificar()
const { data: alfaFinal } = await sharp(DESTINO)
  .ensureAlpha()
  .extractChannel(3)
  .raw()
  .toBuffer({ resolveWithObject: true })

console.log(`Origen del alfa: ${mascara.origen}`)
console.log(`Recorte del logo: ${mascara.recorte.width}×${mascara.recorte.height}`)
console.log(`Forma escalada: ${forma.anchoForma}×${forma.altoForma} (offset ${forma.offsetX},${forma.offsetY})`)
console.log(`Escrito: ${path.relative(RAIZ, DESTINO)}`)
console.log(stats)
console.log('\nVista ASCII del canal alfa (24×24):\n')
console.log(vistaAscii(alfaFinal))
