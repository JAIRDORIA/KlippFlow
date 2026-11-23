import { describe, expect, it } from 'vitest'
import type { ServicioSinCita } from '../types'
import {
  MAX_SERVICIOS_SIN_CITA,
  MONTO_COBRADO_MAXIMO,
  alternarServicio,
  construirCuerpoSinCita,
  duracionCatalogo,
  duracionDeServicio,
  puedeAgregarServicio,
  precioDeServicio,
  totalCatalogo,
  validarSinCita,
} from './sinCita'

function servicio(
  parcial: Partial<ServicioSinCita> & { id: number },
): ServicioSinCita {
  return {
    nombre: `Servicio ${parcial.id}`,
    descripcion: null,
    precio: 20000,
    duracionMinutos: 30,
    activo: true,
    ...parcial,
  }
}

const corte = servicio({ id: 1, nombre: 'Corte', precio: 20000, duracionMinutos: 30 })
const barba = servicio({ id: 2, nombre: 'Barba', precio: 5000, duracionMinutos: 10 })
const catalogo = [corte, barba]

function entrada(parcial: Partial<Parameters<typeof validarSinCita>[0]> = {}) {
  return {
    modo: 'atendido' as const,
    catalogo,
    seleccionados: [1, 2],
    textoMonto: '',
    textoPropina: '',
    nombre: '',
    celular: '',
    ...parcial,
  }
}

describe('totales del catálogo', () => {
  it('suma precios que llegan como número o texto', () => {
    expect(totalCatalogo([corte, barba])).toBe(25000)
    expect(totalCatalogo([servicio({ id: 3, precio: '15000' })])).toBe(15000)
    expect(totalCatalogo([])).toBe(0)
  })

  it('ignora precios y duraciones imposibles', () => {
    expect(precioDeServicio(servicio({ id: 4, precio: 'abc' }))).toBe(0)
    expect(precioDeServicio(servicio({ id: 5, precio: -100 }))).toBe(0)
    expect(duracionDeServicio(servicio({ id: 6, duracionMinutos: 0 }))).toBe(0)
  })

  it('suma la duración de los servicios elegidos', () => {
    expect(duracionCatalogo([corte, barba])).toBe(40)
    expect(duracionCatalogo([])).toBe(0)
  })
})

describe('selección de servicios', () => {
  it('alterna un servicio', () => {
    expect(alternarServicio([], 1)).toEqual([1])
    expect(alternarServicio([1, 2], 2)).toEqual([1])
  })

  it('no deja pasar de 10 servicios', () => {
    const llenos = Array.from({ length: MAX_SERVICIOS_SIN_CITA }, (_, i) => i + 1)
    expect(puedeAgregarServicio(llenos)).toBe(false)
    expect(alternarServicio(llenos, 99)).toEqual(llenos)
    // Quitar siempre se puede, incluso en el límite.
    expect(alternarServicio(llenos, 1)).toHaveLength(MAX_SERVICIOS_SIN_CITA - 1)
  })
})

describe('validarSinCita', () => {
  it('exige al menos un servicio', () => {
    const resultado = validarSinCita(entrada({ seleccionados: [] }))
    expect(resultado.valido).toBe(false)
    expect(resultado.errores.servicios).toBe('Elige al menos un servicio.')
  })

  it('avisa si un servicio ya no está en el catálogo activo', () => {
    const resultado = validarSinCita(entrada({ seleccionados: [1, 99] }))
    expect(resultado.valido).toBe(false)
    expect(resultado.errores.servicios).toBe(
      'Ese servicio ya no está disponible. Actualiza la lista e inténtalo de nuevo.',
    )
  })

  it('rechaza una duración total fuera de 5–600 minutos', () => {
    const largos = Array.from({ length: 10 }, (_, i) =>
      servicio({ id: i + 1, duracionMinutos: 100 }),
    )
    const resultado = validarSinCita(
      entrada({
        catalogo: largos,
        seleccionados: largos.map((item) => item.id),
      }),
    )
    expect(resultado.duracion).toBe(1000)
    expect(resultado.errores.servicios).toBe(
      'La duración total debe estar entre 5 y 600 minutos.',
    )
  })

  it('acepta el monto vacío y deja que el backend use el catálogo', () => {
    const resultado = validarSinCita(entrada())
    expect(resultado.valido).toBe(true)
    expect(resultado.total).toBe(25000)
    expect(resultado.montoCobrado).toBeNull()
  })

  it('valida el monto cobrado como entero de 0 a 10.000.000', () => {
    expect(validarSinCita(entrada({ textoMonto: '22.000' })).montoCobrado).toBe(22000)
    expect(validarSinCita(entrada({ textoMonto: '0' })).valido).toBe(true)
    expect(validarSinCita(entrada({ textoMonto: '12,5' })).errores.monto).toBe(
      'El monto debe ser un número entero, sin decimales ni letras.',
    )
    expect(
      validarSinCita(entrada({ textoMonto: '10.000.001' })).errores.monto,
    ).toBe('El monto debe estar entre $0 y $10.000.000.')
    expect(validarSinCita(entrada({ textoMonto: String(MONTO_COBRADO_MAXIMO) })).valido).toBe(
      true,
    )
  })

  it('ignora la propina con modo en_curso', () => {
    const resultado = validarSinCita(
      entrada({ modo: 'en_curso', textoPropina: '3.000' }),
    )
    expect(resultado.valido).toBe(true)
    expect(resultado.montoPropina).toBeNull()
  })

  it('valida la propina solo en modo atendido', () => {
    expect(validarSinCita(entrada({ textoPropina: '3.000' })).montoPropina).toBe(3000)
    expect(validarSinCita(entrada({ textoPropina: '0' })).errores.propina).toBe(
      'La propina mínima es $1. Si no dejó propina, elige "No".',
    )
  })

  it('limita el nombre a 100 caracteres', () => {
    const resultado = validarSinCita(entrada({ nombre: 'a'.repeat(101) }))
    expect(resultado.errores.nombre).toBe(
      'El nombre no puede pasar de 100 caracteres.',
    )
  })

  it('normaliza el celular colombiano', () => {
    expect(validarSinCita(entrada({ celular: '+57 300 111 2233' })).celular).toBe(
      '3001112233',
    )
    expect(validarSinCita(entrada({ celular: '12345' })).errores.celular).toBe(
      'Escribe un celular de 10 dígitos que empiece por 3.',
    )
  })
})

describe('construirCuerpoSinCita', () => {
  it('omite el monto cuando coincide con el total del catálogo', () => {
    const cuerpo = construirCuerpoSinCita(
      validarSinCita(entrada({ textoMonto: '25.000' })),
    )
    expect(cuerpo).toEqual({ modo: 'atendido', servicioIds: [1, 2] })
  })

  it('envía el monto cuando el barbero lo cambió', () => {
    const cuerpo = construirCuerpoSinCita(
      validarSinCita(entrada({ textoMonto: '22.000' })),
    )
    expect(cuerpo?.montoCobrado).toBe(22000)
  })

  it('envía propina solo con modo atendido', () => {
    expect(
      construirCuerpoSinCita(validarSinCita(entrada({ textoPropina: '3.000' })))
        ?.montoPropina,
    ).toBe(3000)

    expect(
      construirCuerpoSinCita(
        validarSinCita(entrada({ modo: 'en_curso', textoPropina: '3.000' })),
      ),
    ).toEqual({ modo: 'en_curso', servicioIds: [1, 2] })
  })

  it('recorta los datos del cliente y omite los vacíos', () => {
    const conDatos = construirCuerpoSinCita(
      validarSinCita(entrada({ nombre: '  Pedro  ', celular: '300 111 2233' })),
    )
    expect(conDatos?.clienteNombre).toBe('Pedro')
    expect(conDatos?.clienteCelular).toBe('3001112233')

    const sinDatos = construirCuerpoSinCita(validarSinCita(entrada({ nombre: '   ' })))
    expect(sinDatos).not.toHaveProperty('clienteNombre')
    expect(sinDatos).not.toHaveProperty('clienteCelular')
  })

  it('devuelve null si la validación falló', () => {
    expect(
      construirCuerpoSinCita(validarSinCita(entrada({ seleccionados: [] }))),
    ).toBeNull()
  })
})
