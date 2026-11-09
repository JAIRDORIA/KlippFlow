# PROJECT_CONTEXT — Frontend KlippFlow

Última actualización: **2026-11-09** (Prompt 10: recordatorios por WhatsApp en
la reserva del cliente y en Ajustes del barbero).

## 1. Qué es

KlippFlow es una PWA para barberos: agenda, solicitudes de cita, cuentas,
compras y ajustes. El frontend consume la API del backend descrito en
`docs/backend/`. El diseño y los tokens viven en `docs/DISENO.md` y
`docs/figma-tokens.md`.

## 2. Stack

| Pieza | Versión instalada |
|---|---|
| React / React DOM | 19.3.1 |
| TypeScript | 6.0.3 (estricto) |
| Vite | 8.3.5 |
| React Router DOM | 7.18.5 |
| TanStack React Query | 5.105.0 |
| Tailwind CSS / plugin Vite | 4.3.3 |
| Instrument Sans / DM Mono | @fontsource 5.3.0 |
| lucide-react | 1.63.0 (trazo 1.6) |
| vite-plugin-pwa | 2.0.0 |
| Workbox | 7.4.1 |
| Vitest | 5.0.5 |
| Testing Library React | 16.3.3 |
| jest-dom | 7.0.1 |
| jsdom | 30.1.3 |
| Node | 24.19.0 |
| pnpm | 12.15.0 |

## 3. Estado de avance

Completado:

- Base visual, tokens, fuentes, kit accesible, utilidades de Bogotá, cliente HTTP,
  autenticación del barbero, PWA y enrutamiento por zonas (Prompt 1).
- Reserva pública real en `/b`, `/b/:codigo` y `/cita/:token` (Prompt 2):
  - GET del barbero, disponibilidad por día y POST de creación.
  - Hooks de TanStack Query y polling del seguimiento.
  - Formulario con servicios, acompañantes, fecha/hora y datos.
  - Validación de celular/correo y mapa de errores del backend.
  - Almacenamiento local de citas del cliente.
  - Pantalla de seguimiento con todos los estados y copia del enlace.
  - Pruebas de dominio, almacenamiento y tiempos de Bogotá.
  - `docs/RESERVA_PUBLICA.md`.
- Panel del barbero Hoy y Solicitudes (Prompt 3):
  - `GET /barbero/dashboard/hoy` y `GET /barbero/solicitudes` con TanStack Query.
  - Mutaciones aceptar, rechazar, cancelar, no asistió, atendido y corrección
    de propina, con invalidación de agenda, solicitudes y la clave reservada
    de balance.
  - Pantalla Hoy: contadores, línea de tiempo con estados visuales, próxima
    cita, contador de atendidos, horarios libres y bloques.
  - Pantalla Solicitudes: orden por urgencia, cuenta regresiva viva cada 30 s,
    acompañantes, aviso de descanso y badge en el `BottomNav` (9+).
  - Sheets de atendido/propina, rechazo, cancelación y no asistió, con
    "Avisar" como enlace real al `whatsappUrl`.
  - Refresco por foco, cambio de pestaña, sondeo de 60 s visible y puente del
    service worker.
  - Pruebas de dominio de agenda, propina, errores, cuenta regresiva y fechas.
  - `docs/AGENDA_Y_SOLICITUDES.md`.
- Cuentas y Compras (Prompt 4):
  - `GET /barbero/balance/hoy`, `GET /barbero/balance/historial` y CRUD de
    compras, con claves que incluyen el día de Bogotá.
  - Cuentas: tarjeta financiera (ganancia neta + servicios, propinas y compras),
    gráfico de 30 barras sin librería y lista de días anteriores.
  - Compras: formulario validado, lista de hoy con total del servidor y sheet de
    edición con confirmación de borrado.
  - `MoneyInput` extraído a `shared/ui` y utilidades de monto en
    `shared/lib/montos.ts`, compartidas con la propina de Hoy.
  - Las mutaciones de compras usan el `balance` que devuelve la API para
    adelantar la caché e invalidan compras, balance e historial.
  - Pruebas de dominio de balance, gráfico, lista, accesibilidad y compras.
  - `docs/CUENTAS_Y_COMPRAS.md`.
- Ajustes (Prompt 5):
  - `GET /barbero/configuracion`, CRUD de servicios y CRUD de horarios.
  - Link público con "Copiar" (con respaldo) y "Ver como cliente" en pestaña
    nueva.
  - Servicios: crear, editar, desactivar y reactivar, con validación exacta del
    backend; los inactivos al final con etiqueta.
  - Horarios: 7 filas de Lunes a Domingo, interruptor por día, varios bloques,
    selector de hora nativo y guardado explícito por día con plan de
    POST/PATCH/DELETE.
  - Cerrar sesión con confirmación, limpieza de la caché de TanStack Query y
    redirección al login.
  - Pruebas de dominio de horas, bloques, solapes, servicios, plan de guardado,
    errores y portapapeles.
  - `docs/AJUSTES.md`.
- Onboarding y notificaciones push (Prompt 6):
  - `/instalar` con los cuatro pasos en iPhone sin instalar y activación sola en
    iPhone instalado, Android y escritorio.
  - `GET /barbero/push/llave-publica`, `POST` y `DELETE`
    `/barbero/push/suscripciones` con re-sincronización idempotente al entrar y
    baja al cerrar sesión.
  - Service worker con `push` (payload real `{ titulo, cuerpo, url }`) y
    `notificationclick` (enfoca o abre la app en `/app/solicitudes`).
  - Tarjeta "Notificaciones" en Ajustes con estados, activar/desactivar y enlace
    a la guía de instalación.
  - Política de "Hacerlo después" de 24 h y detección de iOS/iPadOS, modo
    instalado y soporte de push.
  - Pruebas de dominio de VAPID, plataforma, decisión de onboarding, URL del
    clic, suscripción y errores.
  - `docs/NOTIFICACIONES.md`.
- Panel de administración (Prompt 7):
  - Sesión de admin separada (`klippflow.admin.sesion`), `AdminAuthProvider`,
    `ProtectedAdminRoute` y `useAdminAuth`.
  - `/admin/login` y `/admin` con buscador, chips con conteo y filas con estado.
  - Crear barbero con contraseña provisional generada en el cliente
    (`crypto.getRandomValues`) y entrega de datos de una sola vez.
  - Cambio de estado con confirmación, rotación de código y restablecimiento de
    contraseña, cada uno mostrando el resultado una sola vez.
  - Los secretos viven solo en el estado de los sheets: nada en caché,
    `localStorage` ni URL.
  - Pruebas de dominio de contraseña, formulario, búsqueda, lista, estados,
    errores, enlaces y texto de entrega, más la sesión del admin.
  - `docs/ADMIN.md`.
- Ajustes visuales (2026-10-31): contadores de Hoy en rejilla de 3 columnas iguales con etiquetas en una línea, horas siempre en formato 12 h con `am`/`pm` (helper `hora12`) y se quitó "Ver como cliente" de Ajustes.
- Pulido de PWA (Prompt 8):
  - Logo real (`public/icons/logo-512.png`) en un componente único `Logo`
    (sm/md/lg) sobre baldosa hueso; fuera el placeholder y su código muerto.
  - Manifest definitivo (`start_url: /`, íconos `any` y `maskable`
    separados) y `index.html` con favicons, `apple-touch-icon` y metas de iOS.
  - Actualización del service worker en modo `prompt`: banda "Hay una versión
    nueva" con "Actualizar"/"Ahora no", sin recargas automáticas, y
    comprobación al volver a la app cada 30 min. Push intacto.
  - 404 con logo y botón según la sesión, `ErrorBoundary` global y por zona, y
    aviso "Sin conexión".
  - Título del documento por ruta (`useTituloPagina` + `rutas.ts`), `noindex`
    centralizado y `robots.txt` con excepción para `/privacidad`.
  - `vercel.json` (rewrites, caché y cabeceras de seguridad) y `.env.example`
    con las variables `VITE_`.
  - `docs/PWA.md` y `docs/DESPLIEGUE_FRONTEND.md`.
- Correcciones post-despliegue (Prompt 9, 2026-11-02):
  - **Logo en páginas públicas:** el relleno de la baldosa se calcula en px a
    partir del lado (`14 %`). Un padding porcentual se resolvía contra el ancho
    del contenedor y en `/b/:codigo` dejaba la imagen en 0×0: la baldosa hueso
    se veía vacía. `src` absoluto, `width`/`height` explícitos y monograma de
    respaldo si la imagen falla (`onError`).
  - **Badge de notificación:** `public/icons/badge-96.png` es blanco puro con
    la forma en el alfa (Android lo usa como máscara). Se genera desde el logo
    con `pnpm badge` (`scripts/generar-badge.mjs`, `sharp` como devDependency).
    El SW usa `icon: '/icons/icon-192.png'` y `badge: '/icons/badge-96.png'`.
  - Pruebas nuevas de `Logo` (ruta absoluta, relleno en px, respaldo) y de
    `construirOpcionesNotificacion` (rutas absolutas, URL segura).
- Recordatorios por WhatsApp (Prompt 10, 2026-11-09):
  - Reserva con sesión: casilla de consentimiento explícito
    (`CasillaWhatsapp`) desmarcada por defecto, visible solo si el celular del
    perfil normaliza a 10 dígitos. Muestra el celular en formato `300 111 2233`.
  - `POST /cliente/barberos/:codigo/citas` envía siempre
    `aceptaWhatsapp: true | false`; no se persiste en `localStorage`.
  - Ajustes: tarjeta “Recordatorios por WhatsApp” con celular, interruptor y
    “Guardar”; `PUT /barbero/configuracion/whatsapp` e invalidación de
    `['barbero','configuracion']`.
  - Validación y cuerpo del PUT en `features/ajustes/domain/whatsapp.ts`,
    reutilizando `normalizarCelular` de la reserva pública.
  - Pruebas de dominio, cuerpo del PUT, `aceptaWhatsapp` y visibilidad de la
    casilla sin celular de perfil.
  - `docs/RESERVA_PUBLICA.md` y `docs/AJUSTES.md` actualizados.

No implementado todavía:

- "Enviar prueba" de notificaciones (`POST /barbero/push/probar`).
- Pagos y verificación de celular (fuera de alcance de estos prompts).
- Recordatorios por WhatsApp del lado del **envío**: el frontend ya captura el
  consentimiento y lo configura, pero la programación y el envío viven en el
  backend (`docs/backend/WHATSAPP_BASE.md`).

## 4. Estructura

```text
src/
  app/
    router.tsx                 createBrowserRouter; /dev solo en DEV
    ZoneRouter.tsx             elige zona y carga su chunk con lazy
    RootRedirect.tsx           / según sesión
    NoEncontrada.tsx           404: logo, texto y botón según la sesión
    rutas.ts                   zona + título + noindex en un solo lugar
    useTituloPagina.ts         título del documento por ruta
    MetaNoIndex.tsx            refuerza robots noindex por ruta
    sesionVisible.ts           sesión actual sin providers (para la 404)
    CargandoRuta.tsx
    DevRoute.tsx
    PantallaEnConstruccion.tsx
    layouts/AppLayout.tsx      Outlet + BottomNav
    layouts/AdminLayout.tsx    layout simple de admin
    zonas/BarberZone.tsx       login, instalar, app/*
    zonas/PublicZone.tsx       b, cita
    zonas/AdminZone.tsx        admin
  features/pwa/
    PwaProvider.tsx            registro del SW + avisos de versión y sin conexión
    registroSw.ts              envoltorio de virtual:pwa-register
    domain/actualizacion.ts    regla de 30 min + pruebas
  dev/DevPage.tsx              todos los componentes y estados
  features/auth/
    AuthProvider.tsx
    auth-context.ts / useAuth.ts
    LoginPage.tsx
    ProtectedRoute.tsx
    sesionBarbero.ts           localStorage + lectura de tipo/exp
    antesDeCerrarSesion.ts     registro de tareas
    useAntesDeCerrarSesion.ts
    sesionAdmin.ts             sesión del panel (clave separada)
    AdminAuthProvider.tsx      login, logout y limpieza de ['admin']
    ProtectedAdminRoute.tsx    guard de /admin/*
    types.ts                   tipos tomados de AUTH.md / ADMIN.md
  features/reserva-publica/
    CodigoPage.tsx             /b; solo normaliza el código
    ReservaPage.tsx            /b/:codigo; formulario y POST
    SeguimientoPage.tsx        /cita/:token; estados y copia del enlace
    api.ts / hooks.ts          TanStack Query y polling
    almacenamientoCitas.ts     klippflow.citasCliente
    components/                días, slots, servicios, acompañantes y
                               CasillaWhatsapp (consentimiento explícito)
    domain/                    totales, celular, correo, días, formulario,
                               estados y errores + pruebas
  features/agenda/
    types.ts                   DTOs del panel (solicitudes, dashboard, atención)
    api.ts                     dashboard, transiciones y propina
    claves.ts                  claves de consulta ['barbero', ...]
    hooks.ts                   useDashboardHoy y las seis mutaciones
    HoyPage.tsx                /app/hoy
    components/                sheets de atendido, cancelar y no asistió
    domain/                    agenda, hoy, propina y errores + pruebas
  features/solicitudes/
    api.ts / hooks.ts          GET /barbero/solicitudes
    SolicitudesPage.tsx        /app/solicitudes
    components/                sheet de rechazo
    domain/                    cuenta regresiva y etiqueta de fecha + pruebas
  features/cuentas/
    types.ts                   Balance (hoy e historial)
    api.ts / claves.ts         GET balance/hoy y balance/historial
    hooks.ts                   useBalanceHoy, useHistorialBalance
    CuentasPage.tsx            /app/cuentas
    components/GraficoNeto.tsx 30 barras sin librería
    domain/                    barras, días, aria-label, filas y coherencia
  features/compras/
    types.ts                   Compra, ListaCompras, RespuestaCompra
    api.ts / claves.ts         CRUD de compras
    hooks.ts                   useCompras + crear/editar/eliminar
    ComprasPage.tsx            /app/compras
    components/                sheet de edición con confirmación
    domain/                    validación y errores + pruebas
  features/ajustes/
    types.ts                   Configuracion (incluye whatsapp), Servicio, Horario
    api.ts / claves.ts         configuracion, servicios, horarios y WhatsApp
    hooks.ts                   useConfiguracion/Servicios/Horarios + mutaciones,
                               useActualizarWhatsapp
    AjustesPage.tsx            /app/ajustes
    components/                link, servicios, horarios, sheets y
                               TarjetaWhatsapp
    domain/                    horas, servicios, horarios, whatsapp, errores y
                               portapapeles + pruebas
  features/notificaciones/
    types.ts / api.ts          estados, llave VAPID y suscripciones
    hooks.ts                   useNotificaciones (7 estados + activar/desactivar)
    sincronizacion.ts          sync idempotente y baja al cerrar sesión
    registro.ts                espera acotada al service worker
    InstalarPage.tsx           /instalar (alias /app/instalar)
    components/                pasos, activación y tarjeta de Ajustes
    domain/                    vapid, plataforma, onboarding, urlDestino,
                               suscripción y errores + pruebas
  features/admin/
    types.ts / api.ts          barberos y login del panel
    claves.ts / hooks.ts       ['admin','barberos'] + mutaciones
    AdminLoginPage.tsx         /admin/login
    AdminListaPage.tsx         /admin
    components/                sheets de alta y detalle, píldora, secretos
    domain/                    password, formulario, texto, lista, estado,
                               errores, enlaces y entrega + pruebas
  shared/api/
    client.ts                  petición, ErrorPeticion, 401/403
    almacenamientoSesion.ts    claves, leerToken, zonaPorRuta
  shared/lib/
    format.ts / fechas.ts / montos.ts / pwa.ts / cn.ts / useAhora.ts + tests
  shared/ui/                   kit + MoneyInput + EstadoError + Sheet.test
  styles/tokens.css            fuente única de valores visuales
  styles/globals.css           reset, tipografía, shell, animaciones
  sw.ts                        service worker
```

## 5. Rutas

| Ruta | Zona | Estado |
|---|---|---|
| `/` | — | Redirige a `/mi` (cliente), `/app` (barbero) o `/login` (sin sesión). |
| `/login` | público | Real: formulario unificado, Google y recuperación. |
| `/instalar` | barbero | Real: pasos de instalación y activación de notificaciones (`/app/instalar` redirige aquí). |
| `/app/hoy` | barbero | Real: contadores, agenda, próximas acciones y horarios libres. |
| `/app/solicitudes` | barbero | Real: orden por urgencia, cuenta regresiva y aceptar/rechazar. |
| `/app/cuentas` | barbero | Real: tarjeta financiera, gráfico de 30 días y lista de días. |
| `/app/compras` | barbero | Real: formulario, lista de hoy y sheet de edición. |
| `/app/ajustes` | barbero | Real: link, servicios, horarios, notificaciones, recordatorios por WhatsApp y cerrar sesión. |
| `/mi` | cliente | Real: inicio con citas próximas, barberos, aviso de app y menú de cuenta. |
| `/mi/citas` | cliente | Real: listado completo de citas. |
| `/mi/citas/:id` | cliente | Real: detalle con servicios por persona. |
| `/mi/instalar` | cliente | Real: instalación y activación de notificaciones del cliente. |
| `/mi/nueva-contrasena` | cliente | Real: cambio de contraseña. |
| `/b` | público | Real; pide el código sin consultar la API. |
| `/b/:codigo` | según sesión | Real; el cliente reserva, el barbero ve el aviso de cambiar de cuenta. |
| `/cita/:token` | público | Real; seguimiento con polling 30 s. |
| `/privacidad` | público | Real; política de privacidad indexable. |
| `/admin/login` | admin | Real: login del panel. |
| `/admin` | admin | Real: lista, alta y detalle en sheets. |
| `/dev` | desarrollo | Kit visual; en producción muestra 404. |

Las zonas se cargan con `React.lazy`: público, barbero y admin van en chunks
separados. `/app/*` exige sesión de barbero y `/mi/*` exige sesión de cliente.

## 6. Convenciones obligatorias

1. **TypeScript estricto, sin `any`.** Los datos externos se reciben como
   `unknown` y se validan. `tsconfig.app.json` tiene `strict`,
   `noUncheckedIndexedAccess` y ESLint prohíbe `any` explícito.
2. **Todos los valores visuales salen de los tokens.** Los componentes usan
   clases Tailwind mapeadas a tokens o `var(--token)`. No hay hexadecimales en
   componentes/estilos; solo existen en `tokens.css` y en metadatos/configuración
   inevitables (meta `theme-color`, manifest, script de íconos).
3. **Datos de servidor solo mediante hooks de TanStack Query.** Los
   componentes no llaman a `fetch`; usan hooks. El login usa `useMutation`.
4. **Montos siempre con `formatearPesos`** (o el componente `Money`). Los montos
   de la API pueden llegar como número o texto; se convierten con `Number`.
5. **Fechas siempre con las utilidades de Bogotá** (`hoyBogota`, `ahoraBogota`,
   `etiquetaDia`, `eyebrowFecha`, `fechaLarga`, `fechaCorta`, `saludo`, `hora12`).
   Nunca se usa la zona del dispositivo.
6. **El `barberoId` nunca se envía.** Sale del JWT en el backend.
7. **Respuestas de error normalizadas** a `{ status, mensaje, campos? }` mediante
   `ErrorPeticion`. El código 400 muestra el mensaje de la API; 401 cierra
   sesión; 403 de cuenta inactiva cierra sesión con aviso.
8. **Accesibilidad:** objetivos táctiles de al menos 40 px, foco visible
   (2 px `--accent`, offset 2), sheets con Esc, toque fuera, bloqueo de scroll y
   foco atrapado; no depender solo del color.
9. **`localStorage` solo para:** token/sesión por zona
   (`klippflow.barbero.sesion`, `klippflow.admin.sesion`), citas guardadas del
   cliente en `klippflow.citasCliente` con `{ token, codigo, creadoEn }` (máximo
   5, sin datos personales) y banderas de interfaz documentadas (por ejemplo,
   onboarding descartado). Nada de datos sensibles adicionales.
10. **Nunca subir `.env`.** `.env` y `.env.*` están ignorados; `.env.example`
    solo contiene nombres.
11. **Al terminar cada prompt:** `pnpm lint`, `pnpm test`, `pnpm build` en verde
    y actualizar este archivo y los docs afectados.
12. **Contrato de API:** si `DISENO.md` contradice `docs/backend/`, manda el
    backend y se reporta. No se inventan campos.

## 7. Autenticación

- **Frontend A (cliente):** login unificado, Google, completar cuenta, `/mi`, `/mi/nueva-contrasena` y reserva con sesión; ranura única `klippflow.sesion` con `{ token, tipo, usuario }` y admin separado; ver `docs/CUENTAS_CLIENTE_FRONT.md`.
- **Frontend B (cliente):** `/mi` completo, `/mi/citas`, `/mi/citas/:id`, `/mi/instalar`, push de cliente y confirmación de reserva con aviso de notificaciones; ver `docs/CUENTAS_CLIENTE_FRONT.md` y `docs/NOTIFICACIONES.md`.
- **Frontend C (passkeys de cliente):** crear, entrar y borrar passkeys desde `/login` y `/mi/seguridad`; la marca `kf_passkey`, el desafío en memoria y la regla de `contrasenaActual` están en `docs/PASSKEYS_FRONT.md`.
- **Privacidad:** `/privacidad` pública e indexable, enlaces en login/registro/reserva/mi y autorización obligatoria al completar la cuenta; ver `docs/PRIVACIDAD.md`.
- Login: `POST /auth/login/barbero` con `{ username, password }`.
- Respuesta: `{ accessToken, barbero: { id, codigoUnico, nombres, apellidos,
  nombreBarberia, username, estadoCuenta } }`.
- Se guarda `{ accessToken, nombre, username, nombreBarberia }` en
  `klippflow.barbero.sesion`.
- `tipo` y `exp` del JWT se leen **solo** para decidir si la sesión local sigue
  vigente. No se confía en el payload para autorizar.
- Un token de admin en la clave del barbero se descarta y no abre `/app/*`.
- Un token borrado a mano queda inválido; la siguiente petición protegida
  responde 401 y el cliente redirige a `/login`.
- Al cerrar sesión se ejecutan las tareas registradas con
  `registrarAntesDeCerrarSesion` (tolerantes a fallos). El prompt de push
  registrará allí la baja de la suscripción.
- El admin tiene su propio provider (`AdminAuthProvider`), clave
  `klippflow.admin.sesion` y un guard que exige el tipo `admin` del JWT.

## 8. Cliente HTTP

- Base: `import.meta.env.VITE_API_URL` (sin barra final).
- Envía `Accept: application/json` y `Content-Type: application/json` cuando hay
  cuerpo; agrega `Authorization: Bearer` según la zona.
- `zona`: `barbero`, `admin` o `publico`; se deduce de la ruta si no se indica.
- 401 en zona autenticada: borra la sesión de esa zona y redirige a
  `/login?motivo=sesion-expirada` o `/admin/login`.
- 403 con mensaje de cuenta suspendida/vencida/“Cuenta no activa”: borra sesión
  y redirige con `motivo=cuenta-no-activa`.
- Red: `status: 0`, mensaje “No pudimos conectar. Revisa tu internet.”.
- 204/205 devuelven `undefined`.
- `campos` es el arreglo de mensajes de validación cuando la API devuelve
  `message: string[]`.

## 9. Decisiones y discrepancias detectadas

- **Rutas de documentación:** al inicio no existían `docs/DISENO.md` ni
  `docs/backend/`; estaban como `docs/Diseno.md` y `docs/docs-backend/`. Se
  renombraron a las rutas pedidas.
- **Copy de 403 en login:** `DISENO.md` 6.1 pide “Tu cuenta no está activa. Habla
  con el administrador de KlippFlow.”; `AUTH.md` devuelve “Tu cuenta está
  suspendida o vencida. Comunícate con el administrador de la plataforma.”.
  Siguiendo la regla de que manda el backend, el login muestra el mensaje de la
  API y usa el texto del diseño como respaldo si la API no trae mensaje.
- **429 del login de barbero:** `AUTH.md` documenta el throttling de admin
  (5/min) pero no el del barbero; `PUBLICO_INFO_Y_DISPONIBILIDAD.md` sí fija
  `POST /auth/login/barbero` en 10/min y `DISENO.md` pide el mensaje de 429. La
  UI maneja cualquier 429 con “Demasiados intentos. Espera un minuto e
  inténtalo de nuevo.”.
- **URL del push:** `NOTIFICACIONES_PUSH.md` documenta `url: "/solicitudes"`,
  pero la ruta real del mapa es `/app/solicitudes`. El service worker normaliza
  exactamente `/solicitudes` → `/app/solicitudes`. Las demás URLs internas se
  respetan.
- **Campos del payload push (Prompt 6):** el payload real es
  `{ titulo, cuerpo, url }` (claves planas en español; verificado en el código del
  backend, `PushPayload`). El service worker lee esas claves y admite
  `title`/`body` como respaldo. `url` viene como `/solicitudes` y se traduce a
  `/app/solicitudes`.
- **Onboarding iPhone (Prompt 6):** implementado. Tras el login,
  `decidirOnboarding()` manda a `/instalar` en iPhone sin instalar (pasos
  completos) o cuando hay que activar notificaciones; si el permiso ya está
  concedido/denegado o se pulsó "Hacerlo después" hace menos de 24 h, va a
  `/app/hoy`.
- **`nombreBarberia`:** es opcional al crear un barbero en `ADMIN.md`; el login
  del frontend acepta `null` sin inventar el campo.
- **Horizonte público:** `hoy` a `hoy + 7` inclusive son 8 fechas. El selector
  parte de `hoyBogota()` y no consulta días que no estén seleccionados.
- **Horas de hoy:** la disponibilidad omite los inicios anteriores a
  `ahora + 30 min`; no hay un estado para horas pasadas. La UI solo pinta los
  slots devueltos.
- **Servicios por acompañante:** `DISENO.md` 6.10 hablaba de uno, pero
  `PUBLICO_CREAR_CITA.md` permite 1–10 `servicioIds` por persona. Decisión de
  producto: la UI permite varios por acompañante, con máximo 10 por persona.
- **Servicios en el seguimiento:** `GET /public/citas/:token` no devuelve los
  servicios ni el POST los devuelve. El seguimiento omite la fila “Servicios” y
  muestra Fecha, Hora y Total; no se inventa el campo.
- **Cita activa local:** el registro `{ token, codigo, creadoEn }` no guarda el
  estado. La franja de `/b/:codigo` usa la cita guardada más reciente de ese
  código; el estado real se consulta en `/cita/:token`.

### Decisiones del Prompt 3 (Hoy y Solicitudes)

- **Contador "Libres" → "Atendidos":** `GET /barbero/dashboard/hoy` no expone
  ningún contador de horarios libres; `huecosLibres` es un arreglo de rangos.
  `DISENO.md` 6.3 pedía "Libres". Decisión del dueño (2026-10-30): quitar ese
  contador y mostrar **Atendidos** (`resumen.atendidas`). Los tres contadores
  quedan: Por atender (`resumen.aceptadas`), Atendidos (`resumen.atendidas`) y
  Solicitudes (`resumen.solicitudesPendientes`).
- **DTO de la cita del dashboard:** el documento dice literalmente
  `"...": "resto del DTO de cita"`. Se usa el DTO documentado en la sección de
  solicitudes más `puedeMarcarNoAsistio` y `atencion`; los campos que solo
  existen en un contexto quedan opcionales en `CitaBarbero` y la UI tolera que
  falten.
- **Acompañantes sin edad:** `DISENO.md` 6.3 ejemplifica "Hijo (8 años)". El
  contrato solo trae `personas[].nombre` (opcional al crear) y sus servicios, así
  que no se muestra ninguna edad ni se inventa el dato.
- **Ventana de corrección de propina:** se valida contra
  `atenciones.fecha_balance`, no contra `citas.fecha`. El dashboard solo lista
  citas de hoy, así que la corrección se ofrece siempre desde la línea
  "Atendido" y, si el backend responde 409, se muestra su mensaje sin cambiar
  nada.
- **409 de expiración:** el mensaje de la API
  (`Esta solicitud expiró (pasaron más de 2 horas)`) se normaliza a
  "Esta solicitud ya expiró" al aceptar o rechazar, como pide `DISENO.md` 6.6.
  Los demás 409 (cruce, ya respondida) usan el texto de la API.
- **"Avisar" del toast:** `whatsappUrl` solo llega en aceptar, rechazar y
  cancelar. `no-asistio` no lo devuelve según el backend, así que ese toast no
  muestra el botón. El botón es un `<a target="_blank">` real dentro del toast.
- **Toast de acción:** 8 s para que el botón "Avisar" sea alcanzable.
- **Invalidación:** todas las claves del panel cuelgan de `['barbero']`. Una sola
  invalidación cubre dashboard, solicitudes y la clave reservada
  `['barbero','balance','hoy']` para Cuentas.
- **`onCerrar` estable en los sheets:** se envuelve en `useCallback` para que un
  refetch de 60 s no vuelva a ejecutar el efecto del `Sheet` y robe el foco del
  campo de propina.
- **`main.tsx` sin cambios:** el puente del service worker ya invalidaba todas
  las consultas montadas al recibir `{ tipo: 'klippflow:refrescar' }`, lo que
  incluye dashboard y solicitudes.

### Decisiones del Prompt 4 (Cuentas y Compras)

- **Claves con el día:** `clavesBalance.hoy(fecha)`,
  `clavesBalance.historial(fecha)` y `clavesCompras.lista(fecha)` incluyen el día
  de Bogotá (`fechaConsulta`). Al pasar la medianoche la clave cambia y la
  consulta se refresca sola; `useAhora(60_000)` es el reloj que detecta el
  cambio sin sondeos agresivos.
- **La clave reservada del Prompt 3 se movió:** `['barbero','balance','hoy']`
  dejó de estar en `features/agenda/claves.ts` y ahora vive en
  `features/cuentas/claves.ts` con la fecha. Sigue colgando de `['barbero']`, así
  que la invalidación de Atendido y propina la cubre sin cambios.
- **`MoneyInput` compartido:** el campo de monto con puntos de miles estaba
  dentro del sheet de propina. Se extrajo a `src/shared/ui/MoneyInput.tsx` y las
  reglas de texto a `src/shared/lib/montos.ts`. La propina conserva su
  comportamiento (7 dígitos, rango 1–1.000.000) y Compras usa 8 dígitos
  (1–50.000.000). `formatearMilesEntrada` y `parsearMiles` siguen exportándose
  desde `features/agenda/domain/propina.ts` para no tocar importaciones.
- **La pantalla no recalcula la ganancia:** siempre muestra `gananciaNeta` de la
  API. `esBalanceCoherente()` solo verifica en pruebas la fórmula
  `servicios + propinas − compras`.
- **Anticipos y devoluciones:** llegan en la respuesta y siempre valen 0 en la
  Fase 1; no se muestran.
- **Compras y balance:** `POST` y `PATCH` devuelven `{ compra, balance }`; se usa
  el `balance` para `setQueryData` de hoy y además se invalidan compras, balance
  e historial. `DELETE` responde 204, así que solo invalida.
- **Descripción sin `maxLength`:** se permite escribir de más para poder explicar
  el límite de 150; el formulario queda inválido y muestra el motivo.
- **Mensaje del 409 de compras:** el prompt pide "Esta compra ya no se puede
  modificar"; el backend responde "Solo puedes modificar una compra el mismo día
  en que se registró". Se usa el texto del prompt y se reporta la diferencia.

### Decisiones del Prompt 5 (Ajustes)

- **Interruptor de día sin campos nuevos:** el backend no tiene "día activo";
  se deriva de los bloques. Día activado = al menos un bloque con
  `activo: true`. Apagar = `PATCH { activo: false }` a cada bloque activo
  (conserva las horas). Encender sin bloques = `POST` 09:00–13:00. Ver
  `docs/AJUSTES.md` §3.
- **Guardado explícito por día:** `planificarGuardado()` (pura y con pruebas)
  traduce el borrador a `DELETE`/`PATCH`/`POST` y se ejecutan en orden. El primer
  error se muestra en la fila y no se pierde lo escrito.
- **Horas:** la columna TIME puede llegar como `HH:mm:ss`; se normaliza a
  `HH:mm` con `normalizarHora`. El selector nativo (`input type="time" step=900`)
  devuelve 24 h y debajo se muestra el rango en 12 h.
- **Servicios, sin máximos inventados:** el backend solo documenta
  `precio >= 1`; no se valida un tope superior. `descripcion` vacía se envía como
  `''` al editar para poder borrarla y se omite al crear.
- **Duraciones:** `textoDuracion` usa `1 h 15 min` / `45 min` (lo pide este
  prompt) en lugar del `90 min` de `DISENO.md` §4 para servicios.
- **Link público:** se muestra `linkReservas` completo; `codigoUnico` no se
  muestra, solo alimenta el `href` de "Ver como cliente".
- **Cerrar sesión:** `cerrarSesion()` + `queryClient.clear()` +
  `navigate('/login')`, para que no quede nada del barbero anterior.
- **Invalidación:** servicios invalida solo `['barbero','servicios','todos']`;
  guardar un día invalida `['barbero','horarios']` y `['barbero','dashboard','hoy']`
  (bloques y huecos de Hoy dependen de los horarios).

### Decisiones del Prompt 6 (onboarding y push)

- **Payload real, sin suposiciones:** el backend envía
  `{ titulo, cuerpo, url }`; el service worker lee esas claves (con `title`/`body`
  como respaldo) y usa "Nueva solicitud de cita" / "Tienes una nueva solicitud de
  cita." si faltan.
- **`url` heredada:** el backend manda `/solicitudes`, la app usa
  `/app/solicitudes`. `urlDestinoSegura()` traduce esa ruta, exige mismo origen y
  cae a `/app/solicitudes` con cualquier URL externa o esquema raro.
- **Ruta del onboarding:** la canónica es `/instalar` (DISENO.md 6.2 y mapa de
  rutas); se añadió el alias `/app/instalar` que redirige, porque el prompt la
  nombra así.
- **Permiso solo con toque:** `activar()` se ata a un clic y pide el permiso como
  primera operación asíncrona; nunca se pide al montar ni al iniciar sesión.
- **Interruptor del día del onboarding:** `decidirOnboarding()` no se ofrece si el
  permiso es `granted`/`denied` ni dentro de las 24 h posteriores a "Hacerlo
  después" (`localStorage`, clave `klippflow.onboarding.instalacion`).
- **Cierre de sesión suave:** al salir se hace `DELETE` de la suscripción en el
  backend pero **no** `unsubscribe()` en el navegador; así el siguiente barbero
  recupera el `endpoint` (el backend lo reasigna) sin volver a activar.
- **`pushsubscriptionchange` no se implementa:** el service worker no tiene JWT y
  el backend no lo documenta; la re-sincronización ocurre al abrir la app.
- **Service worker en desarrollo:** `devOptions` activado con `type: 'module'` y el
  precache guardado tras un `if` sobre `self.__WB_MANIFEST` (en dev llega vacío y
  `createHandlerBoundToURL('index.html')` lanzaría). Producción sigue emitiendo
  `dist/sw.js` clásico.
- **"Enviar prueba" no se implementó:** `POST /barbero/push/probar` existe pero
  queda fuera de este prompt.

### Decisiones del Prompt 7 (panel de administración)

- **Sesión separada de verdad:** `AdminAuthProvider` propio con
  `klippflow.admin.sesion`, validación de `tipo === 'admin'` y `exp`, y
  `ProtectedAdminRoute`. Al quedar sin sesión se borran **solo** las consultas
  `['admin', …]`.
- **Lista sin paginar:** se piden 50 (máximo del backend) porque los conteos de
  los chips y la búsqueda por nombre y apellidos no los cubre la API; se avisa
  cuando hay más de 50.
- **Orden por nombre:** el backend devuelve por creación descendente; la lista se
  reordena alfabéticamente (insensible a acentos) como pide el prompt.
- **La contraseña la escribe el panel:** el backend no la genera ni la devuelve,
  así que se propone una de 12 caracteres con `crypto.getRandomValues` (sin
  0/O/1/l/I y con mayúscula, minúscula y dígito).
- **Secretos solo en memoria:** los sheets se montan al abrir y se desmontan al
  cerrar, así que la contraseña y el código nuevo desaparecen solos. Nunca van a
  la caché de TanStack Query, a `localStorage` ni a la URL.
- **`correo` obligatorio:** `DISENO.md` §6.12 lo daba por opcional, pero
  `ADMIN.md` lo exige (columna NOT NULL). Se marca obligatorio en el formulario.
- **`nombres` y `apellidos` van separados:** el backend los pide por separado; el
  formulario tiene los dos campos (el prompt hablaba de "Nombre").
- **Estado sin leer la respuesta:** `PATCH .../estado` no documenta el cuerpo de
  respuesta, así que la UI aplica el estado elegido e invalida la lista.
- **Detalle en sheet:** el prompt define el detalle como sheet; la ruta
  `/admin/barberos/:id` del marcador del prompt 1 ya no existe.
- **`noindex`:** `MetaNoIndex` lo añade en rutas privadas, reservas y 404;
  `/privacidad` queda indexable y `robots.txt` permite solo esa ruta.

### Decisiones del Prompt 8 (pulido de PWA)

- **Un solo lugar para la estructura de rutas:** `src/app/rutas.ts` decide zona,
  título y `noindex`. `ZoneRouter` (antes tenía su propia copia de
  `zonaDeRuta`), `useTituloPagina` y `MetaNoIndex` leen de ahí.
- **Actualización con `registerType: 'prompt'`:** el service worker nuevo queda
  en espera y se quitó el `skipWaiting()` del `install`; solo se activa al
  pulsar "Actualizar" (banda persistente, no toast, para que no se pierda
  mientras el usuario trabaja).
- **Comprobación de versión cada 30 min:** al volver a la app se llama a
  `registration.update()` como mucho cada media hora (regla pura con pruebas);
  el navegador ya revisa al navegar.
- **El logo siempre en baldosa hueso:** el logo real es casi negro y sobre
  `--bg` desaparecía; la baldosa usa `--accent` y el archivo de 512 px (con `lg`
  = 104 px sobra incluso a 3×, por eso no se usa el de 1024).
- **`alt` según contexto:** decorativo (`alt=""`) cuando el nombre "KlippFlow"
  ya está al lado; informativo en la 404 y el fallback de error.
- **404 sin revelar `/admin`:** la sesión se lee de `localStorage` validando
  `tipo` y `exp` (`sesionVisible`), porque la 404 también se muestra fuera de
  las zonas donde no hay providers. Sin sesión no aparece ningún enlace a
  `/admin`; se ofrece "Escribir mi código" (`/b`), que es público.
- **Título en el layout, no en cada página:** `AppLayout` y `AdminLayout` ponen
  el título de todas sus rutas hijas (incluida la 404 interna, que el mapeo
  resuelve por ruta); así no hay dos hooks peleándose por `document.title`.
- **Indexación:** se retiró el `X-Robots-Tag` global para que `/privacidad`
  pueda indexarse; `robots.txt` permite solo esa ruta y `MetaNoIndex` cubre el
  resto.
- **Sin CSP:** no se añade hasta que se pida (regla del prompt).

### Decisiones del Prompt 9 (logo y badge)

- **Causa real del logo vacío:** no era un 404. `public/icons/logo-512.png`
  existe, se sirve con 200 y el `src` ya era absoluto. Era el `padding: 14%`:
  el porcentaje se resuelve contra el ancho del contenedor (420/520 px), no
  contra los 40 px de la baldosa `sm`; el contenido de la imagen quedaba en
  0×0 y solo se veía el círculo `bg-accent`. Ahora el relleno es
  `lado * 0.14` en px.
- **Rutas absolutas en todo `public/`:** logo, favicons del `index.html`,
  manifest y badge usan `/icons/...`; no queda ninguna ruta relativa.
- **Respaldo del logo:** `onError` cambia el `<img>` por un monograma “K” con
  `text-ink` sobre la misma baldosa; nunca queda un círculo vacío.
- **Badge monocromático:** Android usa el alfa como máscara; `icon-192.png` a
  color y opaco producía el cuadrado blanco. `badge-96.png` se genera desde el
  alfa del logo (blanco puro, fondo transparente, 10 % de margen) con
  `pnpm badge`. El logo tiene fondo transparente, así que se usó su alfa y no
  la luminosidad.
- **Precache y actualización:** `badge-96.png` entra por `globPatterns` (png);
  el precache pasa de 48 a 49 entradas. No se toca el modo `prompt`: el SW
  nuevo cambia de contenido y el banner “Hay una versión nueva” lo activa con
  `SKIP_WAITING`; añadir `skipWaiting()` automático habría recargado la app.
- **iOS:** ignora `badge`; usa el ícono grande y `apple-touch-icon.png`.

### Decisiones del Prompt 10 (recordatorios por WhatsApp)

- **Consentimiento explícito y efímero:** `aceptaWhatsapp` nace `false` en cada
  visita. No se guarda en `localStorage` ni se reutiliza de una reserva
  anterior; solo viaja en el POST de esa cita.
- **La casilla depende del perfil:** se muestra solo si el celular de la sesión
  del cliente normaliza a 10 dígitos. No se inventa un celular ni se pide uno
  nuevo en la reserva; el backend lo toma del perfil.
- **Un solo texto, sin duplicar:** el cuerpo del POST siempre incluye
  `aceptaWhatsapp` (`true`/`false`). El constructor
  `construirCuerpoCitaCliente` tiene `false` por defecto para que la prueba y los
  usos previos sigan siendo explícitos.
- **Discrepancia con el enunciado del Prompt 10:** se dijo que el PUT recibe
  `{ celular: string, activo: boolean }`, pero `WHATSAPP_BASE.md` §6.1 y el DTO
  real (`ActualizarWhatsappDto`) hacen `celular` **opcional**. Manda el backend:
  al apagar con el campo vacío se envía `{ activo: false }` y se conserva el
  número; una cadena vacía o inválida respondería 400. El tipo del frontend
  refleja `celular?: string`.
- **Validación compartida:** la tarjeta de Ajustes importa
  `normalizarCelular`/`celularValido` desde
  `features/reserva-publica/domain/celular.ts`; no hay una segunda regex.
  `domain/whatsapp.ts` solo agrega las reglas de activación y el cuerpo del PUT.
- **Interruptor bloqueado, no solo validado al guardar:** si no hay celular
  válido, el interruptor no cambia de estado y muestra el motivo con
  `role="alert"`. El botón “Guardar” también queda deshabilitado sin cuerpo.
- **Caché:** `useActualizarWhatsapp` hace `setQueryData` con el `whatsapp`
  normalizado que devuelve el PUT y además invalida
  `['barbero','configuracion']`, compartida con `TarjetaLink`.
- **Errores:** el 404 de WhatsApp se mapea a “Barbero no encontrado” dentro del
  mapa común de Ajustes; 400/403 usan el mensaje de la API y 401/403 de sesión
  siguen el comportamiento del cliente HTTP.

## 10. Verificación

Comandos obligatorios:

```bash
pnpm lint
pnpm test
TZ=UTC pnpm test
TZ=Asia/Tokyo pnpm test
pnpm build
pnpm dev      # http://localhost:3001
```

Comprobado en el Prompt 10 (y se conserva lo verificado antes):

- 61 archivos de prueba, 517 pruebas, en verde con TZ por defecto, `TZ=UTC` y
  `TZ=Asia/Tokyo`.
- TypeScript y ESLint sin errores.
- Build de producción correcto: `dist/` con `index.html`,
  `manifest.webmanifest`, `robots.txt`, `sw.js` e `icons/` (incluye
  `logo-512.png` y `badge-96.png`).
- El service worker generado conserva `push`, `notificationclick`,
  `showNotification` y el mensaje `klippflow:refrescar`; usa
  `icon: '/icons/icon-192.png'` y `badge: '/icons/badge-96.png'`, precachea
  `index.html` (49 entradas) y solo hace `skipWaiting` al recibir
  `SKIP_WAITING`.
- El CSS de producción ya no contiene la regla de padding porcentual de la
  baldosa del logo.
- Manifest comprobado en `dist`: `start_url: /`, `scope: /`,
  `display: standalone`, `lang: es-CO`, íconos 192 y 512 `any` más el
  `maskable` en una entrada aparte.
- Sin hex fuera de `tokens.css` (solo el theme-color del manifest y de
  `index.html`, con el comentario que indica su token de origen).
- Pruebas nuevas del Prompt 10:
  `src/features/ajustes/domain/whatsapp.test.ts` (validación con válido, `+57`,
  espacios, inválido y activar sin celular; cuerpo del PUT),
  `src/features/reserva-publica/components/CasillaWhatsapp.test.tsx`
  (oculta sin celular, desmarcada, texto y cambio) y
  `formulario-cliente.test.ts` (`aceptaWhatsapp` `true`, `false` y `false` por
  defecto).
- Pruebas del Prompt 9 (siguen en verde): `src/shared/ui/Logo.test.tsx` (ruta
  absoluta, relleno en px, respaldo) y
  `src/features/notificaciones/domain/notificacion.test.ts` (rutas absolutas
  del ícono y el badge, URL segura del clic).
- Lo visual (Lighthouse, instalación, iPhone real, badge en Android y el flujo
  de actualización del service worker) es manual: ver `docs/PWA.md` §6 y
  `docs/NOTIFICACIONES.md` §8. Nada de eso queda marcado como verificado aquí.

Nota de herramienta: el build emite una advertencia de Vite 8 proveniente de
`vite-plugin-pwa` (`inlineDynamicImports` deprecado). No es un error de
TypeScript y no afecta el resultado; se revisará cuando el plugin publique una
versión compatible con la nueva API de Rollup.

## 11. Siguiente prompt

El frontend ya está en producción (`https://klippflow.vercel.app`) y el backend
en Clever Cloud. Queda:

- Confirmar en Clever Cloud `APP_PUBLIC_URL=https://klippflow.vercel.app` y el
  CORS del mismo origen, y reiniciar el backend.
- Verificar en Android que el badge nuevo se ve como silueta y en iPhone que
  `badge` se ignora (documentado en `docs/NOTIFICACIONES.md` §3).
- Probar el flujo real con la PWA instalada: login, reserva, push y
  actualización del service worker.
- Lighthouse sobre el dominio real y corrección de lo que quede por debajo
  de 90.
- "Enviar prueba" de notificaciones (`POST /barbero/push/probar`) si se pide.

