import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Logo } from './Logo'

export interface ErrorBoundaryProps {
  children: ReactNode
}

interface EstadoError {
  conError: boolean
}

/**
 * Frontera de errores de la interfaz: si un componente lanza, se muestra un
 * mensaje claro en español con "Recargar" e "Ir al inicio" en lugar de una
 * pantalla en blanco. El error se registra solo en consola (nunca se envía a
 * ningún sitio ni se muestra texto técnico).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, EstadoError> {
  override state: EstadoError = { conError: false }

  static getDerivedStateFromError(): EstadoError {
    return { conError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[KlippFlow] Error en la interfaz', error, info.componentStack)
  }

  private reiniciar = (): void => {
    this.setState({ conError: false })
  }

  override render(): ReactNode {
    if (!this.state.conError) return this.props.children

    return (
      <main className="screen flex min-h-[100dvh] flex-col items-center justify-center text-center">
        <Logo tamano="lg" />

        <h1 className="type-screen-title mt-6">Algo salió mal</h1>

        <p className="type-small mt-3 max-w-[320px] text-secondary">
          No pudimos mostrar esta pantalla. Vuelve a intentarlo; tus datos siguen
          guardados.
        </p>

        <div className="mt-8 flex w-full max-w-[320px] flex-col gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="kf-press inline-flex h-[var(--height-button)] items-center justify-center rounded-[var(--radius-button)] bg-accent px-[var(--padding-button-x)] text-[var(--font-size-form)] font-semibold text-ink"
          >
            Recargar
          </button>

          <a
            href="/"
            onClick={this.reiniciar}
            className="kf-press inline-flex h-[var(--height-button)] items-center justify-center rounded-[var(--radius-button)] bg-transparent px-[var(--padding-button-x)] text-[var(--font-size-form)] font-semibold text-text hover:bg-white-5"
          >
            Ir al inicio
          </a>
        </div>
      </main>
    )
  }
}
