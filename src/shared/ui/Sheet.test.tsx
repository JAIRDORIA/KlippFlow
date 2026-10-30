import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { Input } from './Input'
import { Sheet } from './Sheet'

function renderizarSheet(onCerrar = vi.fn()) {
  render(
    <Sheet
      abierto
      onCerrar={onCerrar}
      titulo="Cliente atendido"
      descripcion="Confirma el cobro."
      pie={<Button>Confirmar</Button>}
    >
      <Input etiqueta="Propina" />
    </Sheet>,
  )
  return onCerrar
}

describe('Sheet', () => {
  it('bloquea el scroll y enfoca el diálogo al abrir', async () => {
    renderizarSheet()

    expect(document.body).toHaveClass('scroll-lock')
    expect(document.body.style.overflow).toBe('hidden')
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus())
  })

  it('se cierra con Esc', () => {
    const onCerrar = renderizarSheet()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCerrar).toHaveBeenCalledTimes(1)
  })

  it('se cierra al tocar el overlay, pero no al tocar el panel', () => {
    const onCerrar = renderizarSheet()

    fireEvent.click(screen.getByRole('dialog'))
    expect(onCerrar).not.toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('sheet-overlay'))
    expect(onCerrar).toHaveBeenCalledTimes(1)
  })

  it('atrapa el foco entre el primer y el último control', async () => {
    renderizarSheet()
    const cerrar = screen.getByRole('button', { name: 'Cerrar' })
    const confirmar = screen.getByRole('button', { name: 'Confirmar' })

    await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus())

    cerrar.focus()
    confirmar.focus()
    fireEvent.keyDown(confirmar, { key: 'Tab' })
    expect(cerrar).toHaveFocus()

    fireEvent.keyDown(cerrar, { key: 'Tab', shiftKey: true })
    expect(confirmar).toHaveFocus()
  })

  it('restaura el scroll del body al desmontar', () => {
    const { rerender } = render(
      <Sheet abierto onCerrar={() => undefined} titulo="Prueba">
        <p>Contenido</p>
      </Sheet>,
    )
    expect(document.body.style.overflow).toBe('hidden')

    rerender(
      <Sheet abierto={false} onCerrar={() => undefined} titulo="Prueba">
        <p>Contenido</p>
      </Sheet>,
    )
    expect(document.body).not.toHaveClass('scroll-lock')
    expect(document.body.style.overflow).toBe('')
  })
})
