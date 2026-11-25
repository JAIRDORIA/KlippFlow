# Cuentas de cliente — Frontend

Contrato de referencia: `docs/backend/CUENTAS_CLIENTE.md` y
`docs/backend/AUTH.md`. No se inventaron campos.

## Rutas

| Ruta | Acceso | Pantalla |
|---|---|---|
| `/login` | público | Formulario unificado usuario + contraseña, separador “o” y botón de Google. Acepta `?volver=`. |
| `/login?recuperar=1` | público | Vía secundaria para quien se registró con Google: solo Google, con el texto “¿Te registraste con Google? Entra con Google para crear una contraseña nueva.” y el enlace “Recuperar con un código al correo”. |
| `/registro/verificar` | público | Verificación de correo: código de 6 dígitos, “Verificar” y “Reenviar código” con 60 s de espera. El correo llega en `location.state`; si falta, se pide. Al verificar se inicia sesión. |
| `/recuperar` | público | Recuperación por código: paso 1 “Usuario o correo”; paso 2 código + nueva contraseña. Al terminar va a `/login?motivo=contrasena-restablecida`. |
| `/registro/completar` | solo con registro en memoria | Título “Completa tu cuenta”: nombre, usuario, contraseña y celular. |
| `/mi` | cliente | Inicio completo: saludo, aviso de app/notificaciones, próximas citas (máx. 3), “Ver todas”, mis barberos, agregar por código y menú de cuenta. |
| `/mi/citas` | cliente | Listado completo de citas con estado. |
| `/mi/citas/:id` | cliente | Detalle: estado, mensaje legible, fecha/hora, barbero, servicios por persona y total. Si hay `propuestaCambioHora`, banner “Nueva hora propuesta” con la hora nueva, la anterior, el tiempo restante y Aceptar/Rechazar. |
| `/mi/instalar` | cliente | Onboarding de instalación iOS y activación de notificaciones para cliente. |
| `/mi/seguridad` | cliente | Passkeys: listar, crear con nombre y borrar con confirmación; enlace a cambiar contraseña. |
| `/mi/nueva-contrasena` | cliente | `PUT /cliente/contrasena`; pide `contrasenaActual` salvo Google fresco (≤ 10 min). |
| `/b/:codigo` | según sesión | Público: invitación a entrar. Barbero: aviso para cerrar sesión. Cliente: formulario de reserva; la confirmación incluye el bloque de notificaciones. |
| `/cita/:token` | público | Sin cambios. |
| `/privacidad` | público | Política de privacidad indexable; enlaces desde login, registro, reserva y `/mi`. |
| `/` | según sesión | Cliente → `/mi`; barbero → `/app`; sin sesión → `/login`. |

- El bloque “Entrar” es solo para barberos con las credenciales que dio el administrador; Google, la recuperación y “Completa tu cuenta de cliente” son exclusivos de clientes.
- El inicio del cliente no permite cancelar citas: esa acción queda fuera de este alcance.
- Las tarjetas de `/mi` y `/mi/citas` muestran el chip “Nueva hora propuesta” cuando hay propuesta vigente; aceptar y rechazar solo desde el detalle (`docs/CAMBIO_HORA_FRONT.md`).
- “Mis citas” muestra primero pendientes y próximas aceptadas; el sondeo de 30 s corre si hay una cita pendiente o una propuesta de cambio de hora, solo con la pestaña visible.

`src/app/rutas.ts` y `MetaNoIndex` refuerzan `noindex` en `/mi`, `/registro`,
`/b`, `/cita` y rutas desconocidas. `/privacidad` es la única ruta indexable;
`public/robots.txt` permite solo esa ruta.

## Sesión

- Una sola ranura en `localStorage`: `klippflow.sesion` con
  `{ token, tipo: 'barbero' | 'cliente', usuario }`. Nunca guarda contraseña ni
  `registroToken`.
- El admin sigue separado en `klippflow.admin.sesion`.
- Al iniciar y cerrar sesión se ejecuta `queryClient.clear()`.
- El token se envía como `Authorization: Bearer <token>`. Las llamadas de
  cliente usan la zona `cliente` y las de barbero la zona `barbero`.
- Un 401 en una llamada autenticada borra la sesión y lleva a
  `/login?motivo=sesion-expirada` conservando `volver` cuando es una ruta
  interna permitida por `volverSeguro`.
- `/app` exige barbero (un cliente va a `/mi`); `/mi` y `/mi/*` exigen cliente
  (un barbero va a `/app`).

## Flujo de Google

1. `VITE_GOOGLE_CLIENT_ID` se lee de variables de entorno. Si falta, la app
   compila y funciona, no se muestra el botón y aparece “Inicio con Google no
   disponible”.
2. El script `https://accounts.google.com/gsi/client` se carga de forma
   diferida solo al montar el botón de Google (login y recuperación).
3. Se inicializa con `locale: 'es'` y se renderiza el botón oficial con
   `text: 'continue_with'`. El callback entrega `credential`, que se envía como
   `idToken` a `POST /auth/cliente/google`.
4. Identidad existente: sesión de cliente. Identidad nueva: se guardan
   `registroToken` y `perfil` **solo en memoria** y se navega a
   `/registro/completar`.
5. Si la página se recarga en `/registro/completar`, el estado en memoria se
   pierde: la pantalla redirige a `/login?motivo=google-reiniciar` y el login
   muestra “Vuelve a continuar con Google”.

El `registroToken` y el perfil de Google no se guardan en storage, URL, caché
de TanStack Query ni `history.state`. El único dato que viaja en la URL es
`volver`, validado con `volverSeguro`.

## Verificación de correo y recuperación por código

Contrato: `docs/backend/CUENTAS_CLIENTE.md`.

- **Registro** (`/registro`): el correo es obligatorio y se envía en
  minúsculas. `POST /auth/cliente/registro` responde 201
  `{ requiereVerificacion, correo, mensaje }` **sin token**: no se inicia
  sesión y se navega a `/registro/verificar` con `{ correo, mensaje }` en
  `location.state` (nunca en la URL). Un 409 “Ese correo ya está registrado”
  marca el campo correo.
- **Verificación** (`/registro/verificar`): `POST /auth/cliente/verificar-correo`
  con `{ correo, codigo }`; el código se guarda y se envía como **string** para
  conservar los ceros. El 200 trae `accessToken` y se guarda con el mismo
  mecanismo del login; luego va a `volver` o `/mi`.
- **Reenviar código**: `POST /auth/cliente/reenviar-codigo-verificacion`. Se
  muestra siempre el mensaje genérico del backend, se limpia el código escrito
  (el anterior queda invalidado) y el botón queda bloqueado 60 s.
- **Login con correo sin verificar**: un 403 “Debes verificar tu correo antes
  de iniciar sesión” (contraseña) lleva a `/registro/verificar`. Si el cliente
  escribió un correo se precarga; si escribió su username, la pantalla pide el
  correo porque el backend lo exige. Con passkey se muestra el mensaje y un
  enlace “Verificar mi correo”. El 403 de cuenta desactivada sigue mostrando
  “Tu cuenta no está activa…”.
- **Recuperar contraseña** (`/recuperar`):
  1. `POST /auth/cliente/recuperar-password { identificador }` (username o
     correo, en minúsculas). Siempre se muestra el mensaje genérico y se pasa
     al paso 2; nunca se revela si la cuenta existe.
  2. `POST /auth/cliente/restablecer-password { identificador, codigo,
     nuevaContrasena }`. El identificador vive solo en el estado del
     componente. 200 → `/login?motivo=contrasena-restablecida` (aviso verde
     “Contraseña actualizada. Entra con tu nueva contraseña.”).
- Reglas del código: 6 dígitos (`inputmode="numeric"`, `maxlength=6`,
  `autocomplete="one-time-code"`), vence a los 15 minutos, máximo 5 intentos y
  se invalida al usarlo o al pedir otro. Los 400 (“Código inválido o vencido”,
  “El correo ya está verificado”, reglas de contraseña) se muestran tal cual;
  429 → “Demasiados intentos…”.

## Endpoints usados

- `POST /auth/login`
- `POST /auth/cliente/registro`
- `POST /auth/cliente/verificar-correo`
- `POST /auth/cliente/reenviar-codigo-verificacion`
- `POST /auth/cliente/recuperar-password`
- `POST /auth/cliente/restablecer-password`
- `POST /auth/cliente/google`
- `POST /auth/cliente/completar-cuenta`
- `GET/PATCH /cliente/perfil`
- `PUT /cliente/contrasena`
- `GET /cliente/barberos`
- `POST /cliente/barberos` (agregar por `{ codigo }`)
- `POST /cliente/barberos/:codigo/citas`
- `GET /cliente/citas`
- `GET /cliente/citas/:id` (detalle con `personas`)
- `GET /cliente/push/llave-publica`
- `POST /cliente/push/suscripcion`
- `DELETE /cliente/push/suscripcion`
- `POST /cliente/passkeys/registro/opciones`
- `POST /cliente/passkeys/registro/verificar`
- `GET /cliente/passkeys`
- `DELETE /cliente/passkeys/:id`
- `POST /auth/passkey/opciones`
- `POST /auth/passkey/verificar`
- Públicos que se mantienen: `GET /public/barberos/:codigo`,
  `GET /public/barberos/:codigo/disponibilidad` y `GET /public/citas/:token`.

La reserva envía `{ fecha, horaInicio, personas }`; nombre, celular y correo
salen del perfil del cliente. La reserva anónima
`POST /public/barberos/:codigo/citas` ya no se usa (responde 410).

El detalle de cita usa exactamente el DTO real del backend:
`{ id, estado, fecha, horaInicio, horaFin, barbero, numPersonas, montoTotal,
motivos, personas: [{ esTitular, nombreAcompanante, duracionTotalMinutos,
servicios: [{ nombre, precio, duracionMinutos }] }] }`.

## Inicio del cliente

- `/mi` muestra solo las 3 citas pendientes/próximas; “Ver todas” lleva a
  `/mi/citas`. El detalle está en `/mi/citas/:id`.
- Los estados se traducen a texto visible (el color nunca es la única señal):
  Esperando respuesta, Aceptada, No aceptada, Cancelada, Sin respuesta,
  Atendida y No asististe.
- Agregar barbero por código usa `POST /cliente/barberos`; un 404 muestra
  “No encontramos ese código”.
- El menú “Cuenta” contiene “Cambiar contraseña” y “Cerrar sesión”. No hay
  cancelación de citas desde el cliente.
- El aviso de notificaciones se descarta por cliente durante 7 días en
  `localStorage`; en la confirmación de reserva se muestra destacado y sin
  descarte.

## Cabeceras

`vercel.json` existe y define cabeceras de seguridad y caché, pero **no define
CSP**. Por la regla del prompt, no se añadió ninguna CSP para Google Identity
Services.
