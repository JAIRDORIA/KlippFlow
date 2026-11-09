import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CasillaWhatsapp } from './CasillaWhatsapp'

describe('CasillaWhatsapp', () => {
  it('no se muestra sin celular de perfil', () => {
    const { container } = render(
      <CasillaWhatsapp celular="" acepta={false} onCambio={() => undefined} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('no se muestra si el celular del perfil no normaliza', () => {
    const { container } = render(
      <CasillaWhatsapp celular="123" acepta={false} onCambio={() => undefined} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('aparece desmarcada y muestra el celular del perfil', () => {
    render(
      <CasillaWhatsapp
        celular="3001112233"
        acepta={false}
        onCambio={() => undefined}
      />,
    )

    const casilla = screen.getByRole('checkbox', {
      name: /Quiero recibir recordatorios de mi cita por WhatsApp/i,
    })
    expect(casilla).not.toBeChecked()
    expect(screen.getByText(/300 111 2233/)).toBeInTheDocument()
  })

  it('notifica el cambio de consentimiento', () => {
    const onCambio = vi.fn()
    render(
      <CasillaWhatsapp
        celular="+57 300 111 2233"
        acepta={false}
        onCambio={onCambio}
      />,
    )

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /Quiero recibir recordatorios de mi cita por WhatsApp/i,
      }),
    )

    expect(onCambio).toHaveBeenCalledWith(true)
  })
})
