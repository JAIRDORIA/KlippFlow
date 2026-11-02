import { describe, expect, it } from 'vitest'
import { construirLinkReservas, linkReservasDe } from './enlaces'

describe('construirLinkReservas', () => {
  it('usa el formato documentado por el backend', () => {
    expect(construirLinkReservas('K7M2P9QX', 'https://app.barberapp.com')).toBe(
      'https://app.barberapp.com/b/K7M2P9QX',
    )
  })

  it('tolera barras finales en la base', () => {
    expect(construirLinkReservas('K7M2P9QX', 'https://app.test/')).toBe(
      'https://app.test/b/K7M2P9QX',
    )
    expect(construirLinkReservas('K7M2P9QX', 'https://app.test///')).toBe(
      'https://app.test/b/K7M2P9QX',
    )
  })

  it('respeta una base con subruta', () => {
    expect(construirLinkReservas('ABC12345', 'https://jair.test/klipp')).toBe(
      'https://jair.test/klipp/b/ABC12345',
    )
  })

  it('recorta el código', () => {
    expect(construirLinkReservas('  ABC12345  ', 'https://app.test')).toBe(
      'https://app.test/b/ABC12345',
    )
  })
})

describe('linkReservasDe', () => {
  it('prefiere el link que devuelve la API', () => {
    expect(
      linkReservasDe(
        { codigoUnico: 'ABC12345', linkReservas: 'https://app.test/b/ABC12345' },
        'https://otra.test',
      ),
    ).toBe('https://app.test/b/ABC12345')
  })

  it('lo construye si la API no lo trae', () => {
    expect(linkReservasDe({ codigoUnico: 'ABC12345' }, 'https://app.test')).toBe(
      'https://app.test/b/ABC12345',
    )
    expect(
      linkReservasDe({ codigoUnico: 'ABC12345', linkReservas: '   ' }, 'https://app.test'),
    ).toBe('https://app.test/b/ABC12345')
  })
})
