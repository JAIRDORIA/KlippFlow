import { describe, expect, it } from 'vitest'
import {
  CLAVE_DESCARTE,
  borrarDescarte,
  decidirOnboarding,
  descarteVigente,
  guardarDescarte,
  leerDescarte,
  type AlmacenDescarte,
} from './onboarding'

const AHORA = new Date('2026-10-30T15:00:00.000Z')

function almacenEnMemoria(inicial: Record<string, string> = {}): AlmacenDescarte {
  const datos = { ...inicial }
  return {
    getItem: (clave) => datos[clave] ?? null,
    setItem: (clave, valor) => {
      datos[clave] = valor
    },
    removeItem: (clave) => {
      delete datos[clave]
    },
  }
}

describe('descarteVigente', () => {
  it('es false sin fecha', () => {
    expect(descarteVigente(null, AHORA)).toBe(false)
  })

  it('es true antes de 24 h', () => {
    expect(descarteVigente(new Date('2026-10-30T14:00:00.000Z').toISOString(), AHORA)).toBe(
      true,
    )
    expect(descarteVigente(new Date('2026-10-29T15:00:01.000Z').toISOString(), AHORA)).toBe(
      true,
    )
  })

  it('es false a las 24 h exactas o más', () => {
    expect(descarteVigente(new Date('2026-10-29T15:00:00.000Z').toISOString(), AHORA)).toBe(
      false,
    )
    expect(descarteVigente(new Date('2026-10-20T15:00:00.000Z').toISOString(), AHORA)).toBe(
      false,
    )
  })

  it('es false con una fecha corrupta', () => {
    expect(descarteVigente('no-es-fecha', AHORA)).toBe(false)
  })

  it('es false si la fecha está en el futuro', () => {
    expect(descarteVigente(new Date('2026-10-31T15:00:00.000Z').toISOString(), AHORA)).toBe(
      false,
    )
  })

  it('no depende de la zona horaria del equipo', () => {
    // La fecha se guarda en ISO (UTC); el cálculo es por instantes.
    expect(descarteVigente('2026-10-30T14:00:00.000Z', AHORA)).toBe(true)
    expect(descarteVigente('2026-10-30T09:00:00.000-05:00', AHORA)).toBe(true)
  })
})

describe('decidirOnboarding', () => {
  const base = {
    plataforma: 'ios' as const,
    standalone: false,
    permiso: 'default' as const,
    descartadoEn: null,
    ahora: AHORA,
  }

  it('pide la instalación completa en iPhone sin instalar', () => {
    expect(decidirOnboarding(base)).toBe('completo')
  })

  it('solo ofrece notificaciones si el iPhone ya está instalado', () => {
    expect(decidirOnboarding({ ...base, standalone: true })).toBe('solo_notificaciones')
  })

  it('solo ofrece notificaciones en Android y escritorio', () => {
    expect(decidirOnboarding({ ...base, plataforma: 'android' })).toBe('solo_notificaciones')
    expect(decidirOnboarding({ ...base, plataforma: 'escritorio' })).toBe(
      'solo_notificaciones',
    )
  })

  it('no ofrece nada si ya activó o denegó', () => {
    expect(decidirOnboarding({ ...base, permiso: 'granted' })).toBe('nada')
    expect(decidirOnboarding({ ...base, permiso: 'denied' })).toBe('nada')
    expect(
      decidirOnboarding({ ...base, permiso: 'granted', descartadoEn: null }),
    ).toBe('nada')
  })

  it('respeta "Hacerlo después" durante 24 h', () => {
    const reciente = new Date('2026-10-30T10:00:00.000Z').toISOString()
    expect(decidirOnboarding({ ...base, descartadoEn: reciente })).toBe('nada')

    const viejo = new Date('2026-10-29T10:00:00.000Z').toISOString()
    expect(decidirOnboarding({ ...base, descartadoEn: viejo })).toBe('completo')
    expect(decidirOnboarding({ ...base, plataforma: 'escritorio', descartadoEn: viejo })).toBe(
      'solo_notificaciones',
    )
  })
})

describe('almacenamiento del descarte', () => {
  it('guarda la fecha y la recupera', () => {
    const almacen = almacenEnMemoria()

    guardarDescarte(almacen, AHORA)

    expect(leerDescarte(almacen)).toBe(AHORA.toISOString())
    expect(decidirOnboarding({
      plataforma: 'escritorio',
      standalone: false,
      permiso: 'default',
      descartadoEn: leerDescarte(almacen),
      ahora: new Date('2026-10-30T18:00:00.000Z'),
    })).toBe('nada')
  })

  it('usa la clave documentada', () => {
    const almacen = almacenEnMemoria()
    guardarDescarte(almacen, AHORA)
    expect(almacen.getItem(CLAVE_DESCARTE)).toContain('descartadoEn')
  })

  it('tolera un valor corrupto', () => {
    const almacen = almacenEnMemoria({ [CLAVE_DESCARTE]: '{roto' })
    expect(leerDescarte(almacen)).toBeNull()
  })

  it('tolera un objeto sin fecha', () => {
    const almacen = almacenEnMemoria({ [CLAVE_DESCARTE]: '{"otra":1}' })
    expect(leerDescarte(almacen)).toBeNull()
  })

  it('tolera un almacén ausente', () => {
    expect(leerDescarte(null)).toBeNull()
    expect(() => guardarDescarte(null, AHORA)).not.toThrow()
    expect(() => borrarDescarte(null)).not.toThrow()
  })

  it('borra el descarte', () => {
    const almacen = almacenEnMemoria()
    guardarDescarte(almacen, AHORA)
    borrarDescarte(almacen)
    expect(leerDescarte(almacen)).toBeNull()
  })
})
