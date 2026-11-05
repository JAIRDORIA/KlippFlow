# Política de privacidad — Frontend

## Dónde se edita

- Constantes legales: `src/config/legal.ts`
  - `RESPONSABLE`
  - `CORREO_CONTACTO`
  - `FECHA_ACTUALIZACION`
  - `URL_SITIO`
- Texto y secciones: `src/features/legal/PrivacidadPage.tsx`.
- Enlaces reutilizables:
  - `src/features/legal/components/EnlacePrivacidad.tsx`
  - `src/features/legal/components/TextoAceptacionGoogle.tsx`
- Autorización del registro: `src/features/cuentas-cliente/CompletarCuentaPage.tsx`
  y `src/features/legal/domain/aceptacion.ts`.

## Ruta y indexación

- `/privacidad` es pública y no exige sesión.
- No lleva `noindex`. `public/robots.txt` permite solo `/privacidad` y bloquea
  el resto. Se retiraron el `noindex` global de `index.html` y el
  `X-Robots-Tag` global de `vercel.json` para que la política pueda indexarse.
- `MetaNoIndex` sigue cubriendo rutas privadas, reservas y 404.

## Autorización en el registro

El checkbox de `/registro/completar` es obligatorio y deshabilita “Crear cuenta
de cliente” hasta marcarlo. **Pendiente backend:** el backend no registra
todavía la autorización ni su fecha/versión; solo se valida en el frontend.

## Límites de lo documentado

- La política solo afirma datos confirmados por `docs/backend/`.
- No se afirma que se guarde la foto de perfil de Google: la documentación no la
  menciona.
- No se afirma un borrado automático de cuenta ni una anonimización automática
  de citas: `docs/backend/CUENTAS_CLIENTE.md` no documenta ese mecanismo.
- Los derechos y plazos se redactan conforme a la Ley 1581 de 2012.
