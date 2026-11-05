/** Texto de aceptación que acompaña al botón de Google. */
export function TextoAceptacionGoogle() {
  return (
    <p className="type-helper text-center">
      Al continuar con Google aceptas la{' '}
      <a
        href="/privacidad"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-text"
      >
        Política de privacidad
      </a>
      .
    </p>
  )
}
