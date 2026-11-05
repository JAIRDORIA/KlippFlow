# Passkeys de cliente — Frontend

Contrato: `docs/backend/PASSKEYS.md` y `docs/backend/CUENTAS_CLIENTE.md`.
No se inventaron campos. No se tocó el backend.

## Versión

- Backend: `@simplewebauthn/server` `^14.0.3`.
- Frontend: `@simplewebauthn/browser` `14.0.0` (última publicada de la misma
  major).
- Se usa la API v14: `startRegistration({ optionsJSON })` y
  `startAuthentication({ optionsJSON })`.

## Flujos

### Crear una passkey (`/mi/seguridad` o tarjeta de `/mi`)

1. `POST /cliente/passkeys/registro/opciones` → `{ opciones, desafioToken }`.
2. `startRegistration({ optionsJSON: opciones })`.
3. `POST /cliente/passkeys/registro/verificar` con
   `{ desafioToken, respuesta, nombre? }`.
4. Éxito: se escribe `kf_passkey`, se invalida la lista y se muestra
   “Listo, la próxima vez entra con tu huella o PIN”.

`opciones` y `desafioToken` viven **solo en memoria** durante la operación. No
se guardan en storage, URL, `history.state` ni caché de TanStack Query.

### Entrar con passkey (`/login`)

1. `POST /auth/passkey/opciones` → `{ opciones, desafioToken }`.
2. `startAuthentication({ optionsJSON: opciones })`.
3. `POST /auth/passkey/verificar` con `{ desafioToken, respuesta }`.
4. Se reutiliza el flujo normal de sesión: `queryClient.clear()`, guardar
   `klippflow.sesion` y navegar a `volver` validado por `volverSeguro` o `/mi`.
5. Éxito: se escribe `kf_passkey`. Un `401` de verificación borra la marca.

El botón es visible solo si `soportaPasskeys()`. No se dispara automáticamente
al cargar la página.

## Marca local

- `kf_passkey`: existe si este dispositivo ya creó o usó una passkey con éxito.
  Se borra si el login con passkey responde `401`.
- `kf_passkey_creacion_descarte`: la oferta de creación se oculta 30 días.
- Ambas usan `localStorage` con `try/catch`. Si el storage falla, no se persiste
  y la app sigue funcionando.
- Cerrar sesión **no** borra `kf_passkey`: es una marca del dispositivo, no de la
  sesión.

## Pantallas

- `/login`: si `kf_passkey` existe, “Entrar con huella o PIN” va arriba del
  formulario como acción principal. Si no, “Entrar con passkey” va abajo, junto
  al bloque de Google. Siempre con “Solo para cuentas de cliente.”
- `/mi`: tarjeta descartable “Entra más rápido con tu huella, rostro o PIN” si
  el dispositivo soporta WebAuthn, tiene autenticador de plataforma, no tiene la
  marca y no se descartó en los últimos 30 días.
- `/mi/seguridad`: lista de passkeys (`nombre`, `tipoDispositivo`, “Creada el …”,
  “Último uso …”), alta con nombre editable y borrado con confirmación.
- `/mi/nueva-contrasena`: si `metodo` es `password` o `passkey`, pide la
  contraseña actual. Solo una sesión Google de ≤ 10 minutos permite omitirla.
  En `passkey` se ofrece la recuperación por Google.
- `/mi` es `noindex`; `/mi/seguridad` hereda ese prefijo.

## Mensajes de error

- `NotAllowedError`/`AbortError` → “No se completó. Puedes intentarlo de nuevo.”
  y no se muestra como error (cancelación).
- `InvalidStateError` en registro → “Este dispositivo ya tiene una passkey para
  tu cuenta.”
- `401` en login → “No se pudo iniciar sesión con la passkey. Usa tu usuario y
  contraseña.”
- `409` → “Ya tienes 5 passkeys. Borra una para agregar otra.”
- `429` → “Demasiados intentos, espera un momento.”
- `503` → “Passkeys no disponibles por ahora.”
- Resto → “No pudimos completar la operación. Inténtalo de nuevo.”

## Permissions-Policy

`vercel.json` tenía `Permissions-Policy: camera=(), microphone=(),
geolocation=()`. No mencionaba `publickey-credentials-get` ni
`publickey-credentials-create`; sus allowlists por defecto son `self`. Se
añadieron explícitamente `publickey-credentials-get=(self)` y
`publickey-credentials-create=(self)`.
