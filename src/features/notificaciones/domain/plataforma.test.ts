import { describe, expect, it } from 'vitest'
import { detectarDispositivo, esIos, esModoStandalone } from './plataforma'

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const IPAD_CON_UA_DE_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
const ESCRITORIO_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const CON_PUSH = {
  tieneServiceWorker: true,
  tienePushManager: true,
  tieneNotification: true,
}

describe('detección de plataforma', () => {
  it('reconoce iPhone con Safari', () => {
    const deteccion = detectarDispositivo({ userAgent: IPHONE_SAFARI, ...CON_PUSH })

    expect(deteccion.plataforma).toBe('ios')
    expect(deteccion.standalone).toBe(false)
    expect(deteccion.soportePush).toBe(true)
  })

  it('reconoce iPhone instalada por navigator.standalone', () => {
    expect(
      detectarDispositivo({ userAgent: IPHONE_SAFARI, standalone: true, ...CON_PUSH })
        .standalone,
    ).toBe(true)
  })

  it('reconoce iPhone instalada por display-mode: standalone', () => {
    expect(
      detectarDispositivo({
        userAgent: IPHONE_SAFARI,
        matchMedia: (consulta) => consulta === '(display-mode: standalone)',
        ...CON_PUSH,
      }).standalone,
    ).toBe(true)
  })

  it('trata el iPad con userAgent de Mac como iOS', () => {
    const deteccion = detectarDispositivo({
      userAgent: IPAD_CON_UA_DE_MAC,
      platform: 'MacIntel',
      maxTouchPoints: 5,
      ...CON_PUSH,
    })

    expect(esIos({ userAgent: IPAD_CON_UA_DE_MAC, platform: 'MacIntel', maxTouchPoints: 5 })).toBe(
      true,
    )
    expect(deteccion.plataforma).toBe('ios')
  })

  it('no confunde un Mac de escritorio con un iPad', () => {
    expect(
      detectarDispositivo({
        userAgent: IPAD_CON_UA_DE_MAC,
        platform: 'MacIntel',
        maxTouchPoints: 0,
        ...CON_PUSH,
      }).plataforma,
    ).toBe('escritorio')
  })

  it('reconoce Android Chrome', () => {
    expect(detectarDispositivo({ userAgent: ANDROID_CHROME, ...CON_PUSH }).plataforma).toBe(
      'android',
    )
  })

  it('reconoce escritorio', () => {
    expect(detectarDispositivo({ userAgent: ESCRITORIO_CHROME, ...CON_PUSH }).plataforma).toBe(
      'escritorio',
    )
  })

  it('sin PushManager no hay soporte (iOS menor a 16.4)', () => {
    const deteccion = detectarDispositivo({
      userAgent: IPHONE_SAFARI,
      standalone: true,
      tieneServiceWorker: true,
      tienePushManager: false,
      tieneNotification: true,
    })

    expect(deteccion.plataforma).toBe('ios')
    expect(deteccion.soportePush).toBe(false)
  })

  it('sin Notification tampoco hay soporte', () => {
    expect(
      detectarDispositivo({
        userAgent: ESCRITORIO_CHROME,
        tieneServiceWorker: true,
        tienePushManager: true,
        tieneNotification: false,
      }).soportePush,
    ).toBe(false)
  })

  it('sin datos de soporte asume que no hay soporte', () => {
    expect(detectarDispositivo({ userAgent: ESCRITORIO_CHROME }).soportePush).toBe(false)
  })

  it('esModoStandalone ignora matchMedia cuando navigator.standalone es true', () => {
    expect(
      esModoStandalone({ userAgent: IPHONE_SAFARI, standalone: true, matchMedia: () => false }),
    ).toBe(true)
  })
})
