/** La creación de cuenta exige datos válidos y la autorización expresa. */
export function puedeCrearCuenta(
  formularioValido: boolean,
  aceptaTratamiento: boolean,
): boolean {
  return formularioValido && aceptaTratamiento
}
