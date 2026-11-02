import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Logo } from './Logo'

describe('Logo', () => {
  it('usa una ruta absoluta y tamaño explícito', () => {
    render(<Logo tamano="sm" />)

    const img = screen.getByRole('img', { name: 'KlippFlow' })
    expect(img).toHaveAttribute('src', '/icons/logo-512.png')
    expect(img).toHaveAttribute('width', '40')
    expect(img).toHaveAttribute('height', '40')
  })

  it('calcula el relleno en px a partir del lado, no en porcentaje', () => {
    const { container } = render(<Logo tamano="sm" />)
    const baldosa = container.firstElementChild as HTMLElement

    expect(baldosa.style.width).toBe('40px')
    expect(baldosa.style.height).toBe('40px')
    // 14 % de 40 px. Con un padding en porcentaje se resolvería contra el
    // contenedor (p. ej. 420 px) y la imagen quedaría en 0×0.
    expect(baldosa.style.padding).toBe('5.6px')
    expect(baldosa.style.padding.endsWith('%')).toBe(false)
  })

  it('muestra el monograma si la imagen falla', () => {
    const { container } = render(<Logo />)

    fireEvent.error(screen.getByRole('img', { name: 'KlippFlow' }))

    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('K')).toBeInTheDocument()
  })

  it('es decorativo cuando el nombre ya aparece al lado', () => {
    render(<Logo decorativo />)

    const img = document.querySelector('img')
    expect(img).toHaveAttribute('alt', '')
    expect(img).toHaveAttribute('aria-hidden', 'true')
  })
})
