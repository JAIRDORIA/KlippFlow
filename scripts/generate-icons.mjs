#!/usr/bin/env node
/**
 * Generador local de íconos PROVISIONALES de KlippFlow.
 * Sin dependencias de red ni paquetes externos: usa zlib y un encoder PNG mínimo.
 *
 * Cuando exista el logo real, reemplazar este script por una conversión desde
 * `public/logo-klippflow.svg` (o el master que entregue diseño) y regenerar:
 *
 *   pnpm icons
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const RAIZ = fileURLToPath(new URL('..', import.meta.url))
const SALIDA = join(RAIZ, 'public', 'icons')

const FONDO = [0x12, 0x12, 0x11, 255] // --logo-background
const HUESO = [0xd9, 0xd0, 0xbf, 255] // --accent
const RATIO_LOGO = { normal: 0.58, maskable: 0.7 }

const TABLA_CRC = (() => {
  const tabla = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    tabla[n] = c >>> 0
  }
  return tabla
})()

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = TABLA_CRC[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(tipo, datos) {
  const largo = Buffer.alloc(4)
  largo.writeUInt32BE(datos.length, 0)
  const cuerpoTipo = Buffer.from(tipo, 'ascii')
  const contenido = Buffer.concat([cuerpoTipo, datos])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(contenido), 0)
  return Buffer.concat([largo, contenido, crc])
}

function distanciaASegmento(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const largo2 = dx * dx + dy * dy
  if (largo2 === 0) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * dx + (py - ay) * dy) / largo2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

function crearPng(tamano, ratio) {
  const filas = Buffer.alloc((tamano * 4 + 1) * tamano)
  const centro = tamano / 2
  const alto = tamano * ratio
  const ancho = alto * 0.72
  const grosor = alto * 0.145
  const izquierda = centro - ancho * 0.38
  const arriba = centro - alto / 2
  const abajo = centro + alto / 2

  const segmentos = [
    [izquierda, arriba, izquierda, abajo],
    [izquierda, centro, centro + ancho * 0.42, arriba],
    [izquierda, centro, centro + ancho * 0.42, abajo],
  ]

  let offset = 0
  for (let y = 0; y < tamano; y += 1) {
    filas[offset] = 0
    offset += 1
    for (let x = 0; x < tamano; x += 1) {
      const px = x + 0.5
      const py = y + 0.5
      const enK = segmentos.some(
        ([ax, ay, bx, by]) => distanciaASegmento(px, py, ax, ay, bx, by) <= grosor / 2,
      )
      const color = enK ? HUESO : FONDO
      filas[offset] = color[0]
      filas[offset + 1] = color[1]
      filas[offset + 2] = color[2]
      filas[offset + 3] = color[3]
      offset += 4
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(tamano, 0)
  ihdr.writeUInt32BE(tamano, 4)
  ihdr[8] = 8 // bits por canal
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(filas, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(SALIDA, { recursive: true })

const archivos = [
  ['icon-192.png', 192, RATIO_LOGO.normal],
  ['icon-512.png', 512, RATIO_LOGO.normal],
  ['maskable-512.png', 512, RATIO_LOGO.maskable],
  ['apple-touch-icon-180.png', 180, RATIO_LOGO.normal],
]

for (const [nombre, tamano, ratio] of archivos) {
  const png = crearPng(tamano, ratio)
  writeFileSync(join(SALIDA, nombre), png)
  console.log(`PROVISIONAL: public/icons/${nombre} (${tamano}x${tamano}, ${png.length} bytes)`)
}

console.log('\nEstos íconos son provisionales. Reemplázalos cuando exista el logo real.')
