# KlippFlow — frontend

Aplicación web (PWA) para que un barbero gestione sus citas, su caja y su agenda
desde el teléfono. Este repositorio es **solo el frontend**; el backend vive en
otro proyecto y expone la API descrita en `docs/backend/`.

Estado actual: **frontend completo (Prompt 8)**. Reserva pública, panel del
barbero (Hoy, Solicitudes, Cuentas, Compras y Ajustes), notificaciones push y
panel de administración son reales. Ver `PROJECT_CONTEXT.md`,
`docs/DESPLIEGUE_FRONTEND.md` y `docs/PWA.md` para el detalle.

## Requisitos

- Node.js 22.17 o superior (probado con 22.17 y 24.19).
- pnpm 9 o superior (probado con 11.23; el lockfile es v9).
- Backend disponible para el login real; en local se espera en
  `http://localhost:3000` y en producción en la URL de Clever Cloud.

## Puesta en marcha

```bash
pnpm install
cp .env.example .env
# Editar .env y definir VITE_API_URL (por ejemplo, http://localhost:3000)
pnpm dev
```

La app queda en **http://localhost:3001**. El puerto es fijo (`strictPort: true`)
porque el CORS del backend solo acepta `http://localhost:3001`.

> `.env` está ignorado por git. Nunca subas archivos `.env` ni valores reales de
> configuración. `.env.example` solo contiene nombres de variables.

### Variables de entorno

| Nombre | Obligatoria | Uso |
|---|---|---|
| `VITE_API_URL` | Sí | URL base del backend, sin barra final. Ejemplo: `http://localhost:3000`. |

No hay otras variables de frontend en este prompt.

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | Vite en desarrollo, http://localhost:3001. |
| `pnpm build` | TypeScript estricto + build de producción y service worker. |
| `pnpm preview` | Sirve el build de producción (PWA incluida). |
| `pnpm lint` | ESLint. |
| `pnpm test` | Vitest una vez. |
| `pnpm test:watch` | Vitest en modo watch. |
| `pnpm icons` | Regenera los íconos **provisionales** de la PWA en `public/icons/`. |

Las pruebas se pueden ejecutar con otra zona horaria para comprobar que las
fechas no dependen del equipo:

```bash
TZ=UTC pnpm test
TZ=Asia/Tokyo pnpm test
```

## Estructura

```text
src/
  app/                 Router, redirección raíz, 404, layouts y zonas perezosas
  dev/                 Página /dev con el kit completo (solo desarrollo)
  features/auth/       Login, sesión del barbero, ProtectedRoute, marcador admin
  features/reserva-publica/
                       Reserva pública, dominio, hooks y seguimiento
  shared/api/          Cliente HTTP, errores normalizados, claves de sesión
  shared/lib/          formatos, fechas de Bogotá, PWA y utilidades con pruebas
  shared/ui/           Kit de componentes accesibles
  styles/              tokens.css y estilos globales
  test/                Configuración de Vitest
  sw.ts                Service worker propio (injectManifest)
```

## Rutas

| Ruta | Zona | Estado |
|---|---|---|
| `/login` | barbero | Login real. |
| `/instalar` | barbero | Marcador. |
| `/app/hoy` | barbero | Marcador + BottomNav. |
| `/app/solicitudes` | barbero | Marcador + BottomNav. |
| `/app/cuentas` | barbero | Marcador + BottomNav. |
| `/app/compras` | barbero | Marcador + BottomNav. |
| `/app/ajustes` | barbero | Marcador + BottomNav. |
| `/b` | público | Pide el código del barbero. |
| `/b/:codigo` | público | Reserva de cita. |
| `/cita/:token` | público | Seguimiento de la cita. |
| `/admin/login` | admin | Marcador. |
| `/admin` | admin | Marcador con layout de admin. |
| `/admin/barberos/:id` | admin | Marcador con layout de admin. |
| `/dev` | desarrollo | Kit de componentes; no existe en producción. |

La raíz `/` redirige según la sesión. Las rutas `/app/*` exigen sesión de
barbero. Una ruta desconocida muestra “Página no encontrada”.

## Autenticación y API

- `POST /auth/login/barbero` (según `docs/backend/AUTH.md`).
- La sesión del barbero se guarda en `localStorage` con la clave
  `klippflow.barbero.sesion`. El admin usará `klippflow.admin.sesion` (marcador).
- El cliente lee `tipo` y `exp` del JWT **solo** para decidir si la sesión sigue
  vigente en la interfaz. La autorización real siempre la valida el backend.
- 401: se borra la sesión de la zona y se redirige a su login.
- 403 de cuenta no activa: se cierra la sesión y se explica el motivo.
- Los errores se normalizan a `{ status, mensaje, campos? }`.
- El `barberoId` nunca se envía: sale del token en el backend.

## PWA

- `vite-plugin-pwa` con estrategia `injectManifest` y service worker propio.
- Manifest: nombre/corto “KlippFlow”, `lang` es-CO, `display: standalone`,
  orientación vertical, `theme_color` y `background_color` `#0D0D0E`.
- Registro automático del service worker y actualización en modo `prompt`:
  la versión nueva espera y se activa cuando el usuario pulsa “Actualizar”.
- Precache de assets, `push`, `notificationclick` y aviso a las pestañas
  abiertas para refrescar datos.
- El service worker solo se activa en el build de producción (`pnpm preview`).

### Íconos y badge

Los íconos del manifest y los favicons siguen siendo **provisionales**: fondo
`#121211` con una “K” hueso. Se generan localmente con `pnpm icons` (ver
`scripts/README.md`).

El logo de la app es real (`public/icons/logo-512.png`) y lo pinta
`src/shared/ui/Logo.tsx` sobre una baldosa hueso, con ruta absoluta y monograma
de respaldo si la imagen falla.

El badge de las notificaciones push (`public/icons/badge-96.png`) es blanco con
transparencia y se genera desde el logo con `pnpm badge`.

## Despliegue

Producción: **https://klippflow.vercel.app**

El frontend se publica en Vercel con `vercel.json` (rewrites de SPA, caché y
cabeceras). Los pasos, las variables `VITE_*` y los cambios necesarios en el
backend están en **`docs/DESPLIEGUE_FRONTEND.md`**.

## Documentación fuente de verdad

- `docs/DISENO.md`: diseño, tokens, componentes, pantallas y rutas.
- `docs/figma-tokens.md`: tokens exportados de Figma.
- `docs/backend/`: contrato de la API. Si algo del diseño difiere, manda el
  backend y se reporta.
- `docs/RESERVA_PUBLICA.md`: flujo público, reglas, hooks, estados y SQL de
  prueba.
- `PROJECT_CONTEXT.md`: stack, convenciones obligatorias y estado de avance.
