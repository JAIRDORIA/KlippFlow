# PROJECT_CONTEXT — Frontend KlippFlow

Última actualización: **2026-10-30** (Prompt 2 del frontend).

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

No implementado todavía:

- Pantallas del barbero: Hoy, Solicitudes, Cuentas, Compras y Ajustes.
- Panel de administración y su AuthProvider real.
- Onboarding completo de instalación (`/instalar` sigue como marcador).
- Suscripción/permiso push desde la UI; el service worker ya maneja `push` y
  `notificationclick`.
- Flujo real de notificaciones (activar, enviar prueba, desuscribir al cerrar).
- Pagos, verificación de celular y recordatorios (fuera de alcance de estos
  prompts).

## 4. Estructura

```text
src/
  app/
    router.tsx                 createBrowserRouter; /dev solo en DEV
    ZoneRouter.tsx             elige zona y carga su chunk con lazy
    RootRedirect.tsx           / según sesión
    NoEncontrada.tsx           404 con enlace a /
    CargandoRuta.tsx
    DevRoute.tsx
    PantallaEnConstruccion.tsx
    layouts/AppLayout.tsx      Outlet + BottomNav
    layouts/AdminLayout.tsx    layout simple de admin
    zonas/BarberZone.tsx       login, instalar, app/*
    zonas/PublicZone.tsx       b, cita
    zonas/AdminZone.tsx        admin
  dev/DevPage.tsx              todos los componentes y estados
  features/auth/
    AuthProvider.tsx
    auth-context.ts / useAuth.ts
    LoginPage.tsx
    ProtectedRoute.tsx
    sesionBarbero.ts           localStorage + lectura de tipo/exp
    antesDeCerrarSesion.ts     registro de tareas
    useAntesDeCerrarSesion.ts
    adminAuthPlaceholder.ts    marcador con clave separada
    types.ts                   tipos tomados de AUTH.md / ADMIN.md
  features/reserva-publica/
    CodigoPage.tsx             /b; solo normaliza el código
    ReservaPage.tsx            /b/:codigo; formulario y POST
    SeguimientoPage.tsx        /cita/:token; estados y copia del enlace
    api.ts / hooks.ts          TanStack Query y polling
    almacenamientoCitas.ts     klippflow.citasCliente
    components/                días, slots, servicios y acompañantes
    domain/                    totales, celular, correo, días, formulario,
                               estados y errores + pruebas
  shared/api/
    client.ts                  petición, ErrorPeticion, 401/403
    almacenamientoSesion.ts    claves, leerToken, zonaPorRuta
  shared/lib/
    format.ts / fechas.ts / pwa.ts / cn.ts + tests
  shared/ui/                   kit de componentes + Sheet.test
  styles/tokens.css            fuente única de valores visuales
  styles/globals.css           reset, tipografía, shell, animaciones
  sw.ts                        service worker
```

## 5. Rutas

| Ruta | Zona | Estado |
|---|---|---|
| `/` | — | Redirige a `/app/hoy` o `/login`. |
| `/login` | barbero | Real. |
| `/instalar` | barbero | Marcador protegido. |
| `/app/hoy` | barbero | Marcador + BottomNav. |
| `/app/solicitudes` | barbero | Marcador + BottomNav. |
| `/app/cuentas` | barbero | Marcador + BottomNav. |
| `/app/compras` | barbero | Marcador + BottomNav. |
| `/app/ajustes` | barbero | Marcador + BottomNav. |
| `/b` | público | Real; pide el código sin consultar la API. |
| `/b/:codigo` | público | Real; disponibilidad y creación de cita. |
| `/cita/:token` | público | Real; seguimiento con polling 30 s. |
| `/admin/login` | admin | Marcador. |
| `/admin` | admin | Marcador con AdminLayout. |
| `/admin/barberos/:id` | admin | Marcador con AdminLayout. |
| `/dev` | desarrollo | Kit visual; en producción muestra 404. |

Las zonas se cargan con `React.lazy`: público, barbero y admin van en chunks
separados. `/app/*` exige sesión de barbero.

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
- El admin tiene un marcador (`adminAuthPlaceholder.ts`) con clave
  `klippflow.admin.sesion`; su AuthProvider real queda para el prompt de admin.

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
- **Campos del payload push:** los documentos describen título, cuerpo y `url`
  interna, pero no muestran el JSON completo. El service worker lee las claves
  de nivel superior `title`, `body` y `url` y no asume ningún otro dato. Si el
  backend las envuelve en `data`, habrá que ajustar el contrato.
- **Onboarding iPhone:** el flujo de `DISENO.md` 6.1 enviaría a `/instalar` en
  iPhone no instalado. Este prompt pide explícitamente que tras entrar se vaya a
  `/app/hoy`; `esIphoneNoInstalada()` quedó listo y probado para el prompt de
  onboarding.
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

Comprobado en este prompt:

- 17 archivos de prueba, 118 pruebas, todas en verde con TZ por defecto, UTC y
  Asia/Tokyo.
- TypeScript y ESLint sin errores.
- Build de producción correcto.
- `/b`, `/b/:codigo`, `/cita/:token`, 404 de barbero y 404 de cita verificados en
  Chrome headless a 360 y 390 px sin scroll horizontal.
- Disponibilidad con estados verde/ámbar/rojo, selección de hora, acompañantes,
  totales, validaciones, creación, franja de cita activa y polling de 30 s
  verificados contra un backend simulado.
- Todos los estados del seguimiento renderizados; el enlace se recorta y el
  botón de copiar muestra confirmación o error.

Nota de herramienta: el build emite una advertencia de Vite 8 proveniente de
`vite-plugin-pwa` (`inlineDynamicImports` deprecado). No es un error de
TypeScript y no afecta el resultado; se revisará cuando el plugin publique una
versión compatible con la nueva API de Rollup.

## 11. Siguiente prompt

Implementar las pantallas del barbero sobre la base actual:

- Hoy y Solicitudes con hooks de TanStack Query, polling de 60 s y refresco por
  push.
- Cuentas, Compras y Ajustes.
- Suscripción push usando `registrarAntesDeCerrarSesion`.
- Onboarding `/instalar`.
- Panel admin con su AuthProvider real.
