import { describe, expect, it } from 'vitest'
import { esIphoneNoInstalada, type EntornoIphone } from './pwa'

const base: EntornoIphone = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  standalone: false,
  displayModeStandalone: false,
  maxTouchPoints: 0,
  platform: 'MacIntel',
}

describe('esIphoneNoInstalada', () => {
  it('true en iPhone con Safari fuera de standalone', () => {
    expect(
      esIphoneNoInstalada({
        ...base,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15',
        platform: 'iPhone',
        maxTouchPoints: 5,
      }),
    ).toBe(true)
  })

  it('false cuando ya está instalada', () => {
    expect(
      esIphoneNoInstalada({
        ...base,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
        platform: 'iPhone',
        standalone: true,
        maxTouchPoints: 5,
      }),
    ).toBe(false)

    expect(
      esIphoneNoInstalada({
        ...base,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
        platform: 'iPhone',
        displayModeStandalone: true,
        maxTouchPoints: 5,
      }),
    ).toBe(false)
  })

  it('false en Android y escritorio', () => {
    expect(
      esIphoneNoInstalada({
        ...base,
        userAgent: 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36',
        platform: 'Linux armv8l',
        maxTouchPoints: 5,
      }),
    ).toBe(false)

    expect(esIphoneNoInstalada(base)).toBe(false)
  })

  it('detecta iPadOS que se presenta como MacIntel con touch', () => {
    expect(
      esIphoneNoInstalada({
        ...base,
        platform: 'MacIntel',
        maxTouchPoints: 5,
      }),
    ).toBe(true)
  })
})
