# PWA, logo, íconos y pantallas de borde

Prompt 8 del frontend: pulido de PWA, actualización limpia del service worker,
pantallas de borde (404, error, sin conexión) y metadatos.

> Todo lo de aquí está verificado solo con `pnpm lint`, `pnpm test` y
> `pnpm build`. Las comprobaciones en navegador, Lighthouse e iPhone real son
> manuales y se listan al final; **no** están marcadas como verificadas.

---

## 1. Logo e íconos

### Archivos (`public/icons/`)

| Archivo | Para qué |
|---|---|
| `logo-512.png` (491×512) | Logo de la app dentro de la baldosa hueso (`<Logo />`) |
| `logo-1024.png` | Reserva para piezas grandes; hoy **no** se usa |
| `icon-192.png` | Ícono `any` del manifest y de las notificaciones push |
| `icon-512.png` | Ícono `any` del manifest (instalación) |
| `icon-maskable-512.png` | Ícono `maskable` (el logo queda dentro de la zona segura) |
| `apple-touch-icon.png` | `apple-touch-icon` de iOS (180×180) |
| `favicon.ico`, `favicon-32.png`, `favicon-48.png` | Pestaña del navegador |

### Componente compartido

`src/shared/ui/Logo.tsx` es el único logo de la app:

- Tamaños `sm` (40 px), `md` (72 px) y `lg` (104 px).
- Siempre dentro de una **baldosa redonda hueso** (`bg-accent`, padding interno
  del 14 %): el logo real es casi negro y sobre el fondo `--bg` se perdería.
- `decorativo` pone `alt=""` + `aria-hidden` cuando el nombre "KlippFlow" ya
  aparece al lado (login, admin login, instalar); sin él, `alt="KlippFlow"`.
- Sustituye al placeholder anterior (`LogoKlippFlow`), que se eliminó junto con
  su código muerto.

Dónde se usa: login del barbero (`lg`), login de administración (`lg`),
onboarding `/instalar` (`md`), cabecera de `/b` y `/b/:codigo` (`sm`), 404 y
fallback de error (`lg`), y el kit visual `/dev`.
**La barra inferior no lleva logo.**

---

## 2. Manifest

Generado en `dist/manifest.webmanifest` por `vite-plugin-pwa` (config en
`vite.config.ts`):

```json
{
  "name": "KlippFlow",
  "short_name": "KlippFlow",
  "description": "Agenda, caja y avisos para barberos. Tus clientes reservan sin crear cuenta.",
  "start_url": "/app",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "lang": "es-CO",
  "theme_color": "#0D0D0E",
  "background_color": "#0D0D0E",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

`#0D0D0E` es `--bg` de `src/styles/tokens.css`; el único hex permitido fuera de
tokens (manifest, `index.html` y color de tema), con el comentario que indica de
dónde sale.

`index.html` lleva favicons (ico, 32 y 48), `apple-touch-icon`, `theme-color`,
`apple-mobile-web-app-*` (`black-translucent`), `viewport-fit=cover` y
`lang="es"`.

---

## 3. Actualización del service worker

### Cómo se genera

- `vite-plugin-pwa` con `strategies: 'injectManifest'`: el service worker se
  escribe a mano en `src/sw.ts` y el plugin inyecta la lista de precache.
- Salida: `dist/sw.js` (clásico, un solo archivo).
- `registerType: 'prompt'`: el service worker nuevo **queda en espera**.
- `injectRegister: false`: el registro lo hace la app, no el plugin.

### Estrategia

1. Al terminar una instalación, el service worker nuevo espera (`waiting`); no
   hay `skipWaiting()` en `install`.
2. `PwaProvider` escucha `onNeedRefresh` y muestra la banda
   **"Hay una versión nueva"** con "Actualizar" y "Ahora no".
3. "Actualizar" envía `{ type: 'SKIP_WAITING' }` al service worker en espera
   (lo hace `vite-plugin-pwa`) y recarga. **Nada se recarga solo**: si hay un
   formulario o un sheet a medias, no se pierde.
4. "Ahora no" oculta la banda hasta el próximo arranque.
5. Al volver a la app (`visibilitychange` a visible o `focus`) se llama a
   `registration.update()`, como mucho **una vez cada 30 minutos**
   (`debeComprobarActualizacion`, con pruebas).
6. Los manejadores `push` y `notificationclick` siguen en `src/sw.ts` y no
   dependen del ciclo de actualización: actualizar **no** desuscribe al usuario.

### Reglas de caché

- **La API nunca se cachea**: no hay `runtimeCaching` para `/barbero/*`,
  `/admin/*`, `/public/*` ni `/auth/*`; además la petición es `fetch` normal.
- `index.html` se precachea con revisión: cada build cambia el hash y el service
  worker nuevo trae el HTML nuevo, así que no se queda atascado en una versión
  vieja.
- Los archivos con hash (`/assets/*`) se pueden cachear para siempre; en Vercel
  van con `Cache-Control: public, max-age=31536000, immutable`.
- `cleanupOutdatedCaches()` borra los precaches viejos al activar.

---

## 4. Pantallas de borde

| Pantalla | Archivo | Comportamiento |
|---|---|---|
| 404 | `src/app/NoEncontrada.tsx` | Logo en baldosa, "No encontramos esa página" y botón según la sesión: **barbero** → `/app/hoy`, **administrador** → `/admin`, **sin sesión** → texto neutro ("Pide a tu barbero su link de reservas") + botón a `/b` para escribir el código. Nunca menciona `/admin` sin sesión de admin. |
| Error | `src/shared/ui/ErrorBoundary.tsx` | Una frontera global (en `main.tsx`) y otra por zona (en `ZoneRouter`). Muestra "Algo salió mal", "Recargar" e "Ir al inicio". El error solo se registra en consola. |
| Sin conexión | `src/shared/ui/AvisoSinConexion.tsx` | Banda "Sin conexión" con `role="status"`; aparece con el evento `offline` y desaparece con `online`. No cambia la lógica de las pantallas. |

La 404 decide la sesión con `sesionVisible()` (`src/app/sesionVisible.ts`), que
lee el token guardado y valida `tipo` y `exp`: funciona también fuera de las
zonas, donde no hay providers.

---

## 5. Títulos y noindex

- `src/app/rutas.ts` es el único lugar que decide zona, título y `noindex`.
- `useTituloPagina()` pone el título del documento; se llama en cada layout o
  pantalla suelta (Hoy/Solicitudes/Cuentas/Compras/Ajustes lo heredan de
  `AppLayout`). En `/b/:codigo` añade el nombre de la barbería cuando ya cargó.

| Ruta | Título |
|---|---|
| `/login` | Entrar · KlippFlow |
| `/instalar`, `/app/instalar` | Instalar · KlippFlow |
| `/app/hoy` (y `/app`) | Hoy · KlippFlow |
| `/app/solicitudes` | Solicitudes · KlippFlow |
| `/app/cuentas` | Cuentas · KlippFlow |
| `/app/compras` | Compras · KlippFlow |
| `/app/ajustes` | Ajustes · KlippFlow |
| `/b/:codigo` | Reservar cita · KlippFlow (o `Reservar cita · <barbería> · KlippFlow`) |
| `/cita/:token` | Tu cita · KlippFlow |
| `/admin`, `/admin/login` | Administración · KlippFlow |
| cualquier otra | No encontrada · KlippFlow |

`noindex`: todas las rutas privadas (`/app/*`, `/admin/*`, `/login`,
`/instalar`) y las públicas de reserva y seguimiento (`/b/*`, `/cita/*`). Se
refuerza con `MetaNoIndex` (una sola decisión en `rutas.ts`) y con
`public/robots.txt` (`Disallow: /`); en producción se añade
`X-Robots-Tag: noindex, nofollow`. `index.html` ya trae `noindex, nofollow`
global.

---

## 6. Lista de comprobación para iPhone real (PENDIENTE)

No hay despliegue HTTPS todavía, así que **nada de esto está verificado**.

- [ ] Abrir el dominio en Safari (iOS 16.4 o superior) y comprobar que la app
      carga y que el login funciona.
- [ ] Compartir → "Añadir a pantalla de inicio": el ícono es el de KlippFlow y
      el nombre que aparece es "KlippFlow".
- [ ] Abrir desde el ícono: sin barra de Safari (`standalone`), barra de estado
      **translúcida** y el contenido **no** se corta arriba ni abajo
      (`viewport-fit=cover` + `env(safe-area-inset-*)`). Si algo se corta, pasar
      `apple-mobile-web-app-status-bar-style` a `black`.
- [ ] La barra inferior respeta el área segura (no queda bajo el indicador de
      inicio).
- [ ] `/instalar` detecta iPhone no instalado y muestra los pasos de Compartir.
- [ ] El permiso de notificaciones solo se pide al pulsar el botón (nunca solo).
- [ ] Tras conceder permiso, el barbero recibe una solicitud nueva como
      notificación y al pulsarla abre `/app/solicitudes`.
- [ ] Instalar una versión nueva (build) y reabrir: aparece "Hay una versión
      nueva"; "Actualizar" aplica y la suscripción push sigue viva.
- [ ] Modo avión: aparece "Sin conexión" y desaparece al recuperar la red.

---

## 7. Límites conocidos

- El ícono `maskable` que entregó diseño tiene el fondo casi negro y el logo al
  ~45 % central: no se corta al aplicar la máscara, pero el contraste del logo
  sobre ese fondo es bajo (el logo es negro). Si se quiere más presencia,
  conviene regenerarlo con fondo `--ink` y el logo en hueso.
- `logo-1024.png` no se usa: con `lg` (104 px) el de 512 sobra incluso a 3×, así
  que se excluye del precache (`globIgnores`) y ahorra ~800 KB de instalación.
- El aviso de versión nueva es una banda, no un toast: se queda visible hasta
  que el usuario decide, para que no se pierda si está trabajando.
- La frontera de error por zona se reinicia al cambiar de zona; dentro de la
  misma zona, tras un error, hay que usar "Recargar" o "Ir al inicio".
- `robots.txt` + `X-Robots-Tag` no impiden que alguien con el link vea la
  página: solo evitan que se indexe.
