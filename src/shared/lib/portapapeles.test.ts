import { describe, expect, it, vi } from 'vitest'
import { copiarAlPortapapeles } from './portapapeles'

describe('copiarAlPortapapeles', () => {
  it('usa navigator.clipboard cuando está disponible', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)

    await expect(
      copiarAlPortapapeles('https://app/b/TEST', { clipboard: { writeText } }),
    ).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('https://app/b/TEST')
  })

  it('usa el respaldo si clipboard falla', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('permiso denegado'))
    const comandoCopiar = vi.fn().mockReturnValue(true)

    await expect(
      copiarAlPortapapeles('https://app/b/TEST', {
        clipboard: { writeText },
        document: window.document,
        comandoCopiar,
      }),
    ).resolves.toBe(true)
    expect(comandoCopiar).toHaveBeenCalled()
  })

  it('devuelve false si el respaldo también falla y no deja el textarea', async () => {
    const comandoCopiar = vi.fn().mockReturnValue(false)
    const antes = window.document.body.children.length

    await expect(
      copiarAlPortapapeles('x', { document: window.document, comandoCopiar }),
    ).resolves.toBe(false)
    expect(window.document.body.children.length).toBe(antes)
  })

  it('devuelve false sin clipboard ni documento', async () => {
    await expect(copiarAlPortapapeles('x')).resolves.toBe(false)
  })
})
