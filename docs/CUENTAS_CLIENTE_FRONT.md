# Cuentas de cliente — Frontend

Contrato de referencia: `docs/backend/CUENTAS_CLIENTE.md` y
`docs/backend/AUTH.md`. No se inventaron campos.

## Rutas

| Ruta | Acceso | Pantalla |
|---|---|---|
| `/login` | público | Formulario unificado usuario + contraseña, separador “o” y botón de Google. Acepta `?volver=`. |
| `/login?recuperar=1` | público | Solo Google, con el texto “Entra con Google para crear una contraseña nueva”. |
| `/registro/completar` | solo con registro en memoria | Título “Completa tu cuenta”: nombre, usuario, contraseña y celular. |
| `/mi` | cliente | Mínimo: saludo, “Mis barberos”, estado vacío y cerrar sesión. |
| `/mi/nueva-contrasena` | cliente | `PUT /cliente/contrasena` con `{ nuevaContrasena }`. |
| `/b/:codigo` | según sesión | Público: invitación a entrar. Barbero: aviso para cerrar sesión. Cliente: formulario de reserva. |
| `/cita/:token` | público | Sin cambios. |
| `/` | según sesión | Cliente → `/mi`; barbero → `/app`; sin sesión → `/login`. |

Todas las pantallas heredan el `noindex` global de `index.html`; además,
`src/app/rutas.ts` y `MetaNoIndex` refuerzan `noindex` en `/mi`, `/registro`,
`/b` y `/cita`.

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

## Endpoints usados

- `POST /auth/login`
- `POST /auth/cliente/google`
- `POST /auth/cliente/completar-cuenta`
- `GET/PATCH /cliente/perfil`
- `PUT /cliente/contrasena`
- `GET /cliente/barberos`
- `POST /cliente/barberos/:codigo/citas`
- `GET /cliente/citas` (solo para el aviso mínimo de solicitud pendiente en `/mi`)
- Públicos que se mantienen: `GET /public/barberos/:codigo`,
  `GET /public/barberos/:codigo/disponibilidad` y `GET /public/citas/:token`.

La reserva envía `{ fecha, horaInicio, personas }`; nombre, celular y correo
salen del perfil del cliente. La reserva anónima
`POST /public/barberos/:codigo/citas` ya no se usa (responde 410).

## Cabeceras

`vercel.json` existe y define cabeceras de seguridad y caché, pero **no define
CSP**. Por la regla del prompt, no se añadió ninguna CSP para Google Identity
Services.
