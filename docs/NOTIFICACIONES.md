# Notificaciones push y onboarding de instalación

Prompt 6 del frontend. Implementa el onboarding `/instalar` y las notificaciones
push del barbero (service worker, suscripción y tarjeta de estado en Ajustes).

Fuentes de verdad:

- `docs/backend/NOTIFICACIONES_PUSH.md`
- `docs/DISENO.md` 6.2, 6.9 y 8
- `PROJECT_CONTEXT.md`

No se inventó ningún campo. Las diferencias entre diseño y backend quedan
anotadas en `docs/DISENO.md` §9.

> **Nada de este documento está verificado en un iPhone real.** Lo que sí está
> probado aquí: pruebas unitarias, `lint`, `build` (el `dist/sw.js` sale con los
> manejadores de `push` y `notificationclick`), el service worker de desarrollo
> y que la app arranca en `localhost:3001`. La entrega al dispositivo queda como
> lista de comprobación en el §8.

---

## 1. Estructura

```text
src/sw.ts                                  service worker (precache + push + click)
vite.config.ts                             vite-plugin-pwa (injectManifest + devOptions)

src/features/notificaciones/
  types.ts                                 estados, llave pública y cuerpos
  api.ts                                   llave-publica / suscripciones (POST y DELETE)
  hooks.ts                                 useNotificaciones (estado y acciones)
  sincronizacion.ts                        sync silencioso y baja al cerrar sesión
  SincronizadorNotificaciones.tsx          monta la sync y registra la tarea de logout
  registro.ts                              espera acotada a navigator.serviceWorker.ready
  InstalarPage.tsx                         /instalar
  components/
    PasosInstalacion.tsx                   los cuatro pasos numerados
    IconoPaso.tsx                          SVG propios (sin imágenes de Apple)
    PasoNotificaciones.tsx                 activación a pantalla completa
    TarjetaNotificaciones.tsx              tarjeta de Ajustes
  domain/
    vapid.ts            base64url → Uint8Array
    plataforma.ts       iOS / Android / escritorio y modo instalado
    onboarding.ts       decisión + política de "Hacerlo después"
    urlDestino.ts       URL segura del clic
    suscripcion.ts    PushSubscription → cuerpo de la API
    errores.ts          mapa de errores
    *.test.ts
```

---

## 2. Contrato del backend (paso 0)

| Endpoint | Uso |
|---|---|
| `GET /barbero/push/llave-publica` | Devuelve `{ publicKey }` (base64url). Requiere JWT de barbero. |
| `POST /barbero/push/suscripciones` | Body `{ endpoint, keys: { p256dh, auth } }`. `201` si es nueva, `200` si se actualizó; ambas `{ creada: boolean }`. |
| `DELETE /barbero/push/suscripciones` | Body `{ endpoint }`. `204`. `404` si no es del barbero del token. |

- El `barberoId` sale **siempre** del JWT; enviarlo en el body da 400.
- El `endpoint` es único: si ya existe, se actualizan las llaves y se **reasigna**
  al barbero actual (dos barberos en el mismo equipo).
- Máximo 10 suscripciones por barbero: el backend borra las más antiguas.
- Suscripciones caducadas (404/410 del servicio push): el backend las borra. El
  frontend no tiene que hacer nada; la próxima apertura re-sincroniza.

### Payload real de la notificación

`JSON.stringify(payload)` con `PushPayload` = **`{ titulo, cuerpo, url }`**
(claves en español, planas; `url` = `/solicitudes`):

```json
{
  "titulo": "Nueva solicitud de cita",
  "cuerpo": "Carlos · hoy 3:30 p. m.",
  "url": "/solicitudes"
}
```

Se dispara al crear una cita pública (`estado = pendiente`), **después** del
commit, fire-and-forget. No incluye celular ni correo del cliente.

`/solicitudes` no existe en esta app (la pantalla es `/app/solicitudes`), así que
`urlDestinoSegura` traduce esa ruta heredada. Cualquier URL de otro origen, o con
otro esquema, cae en `/app/solicitudes`.

---

## 3. Service worker

- Escrito a mano en `src/sw.ts`, con `vite-plugin-pwa` en modo `injectManifest`.
- Precache de la app + `NavigationRoute` a `index.html` + `skipWaiting()` en
  `install` y `clients.claim()` en `activate` (con `registerType: 'autoUpdate'`).
- **`push`**: muestra la notificación con `titulo` y `cuerpo` del payload (con
  respaldo `title`/`body` si alguien envía el formato estándar), el ícono
  `/icons/icon-192.png` y `data.url` ya normalizada. Después avisa a las ventanas
  abiertas (`{ tipo: 'klippflow:refrescar' }`) para que la lista de Solicitudes
  se refresque sola.
- **`notificationclick`**: cierra la notificación; si hay una ventana de la app,
  la enfoca y navega; si no, abre una nueva. Siempre en el mismo origen.
- El precache y la navegación solo se registran si el manifiesto trae entradas:
  en `pnpm dev` viene vacío y `createHandlerBoundToURL('index.html')` lanzaría.
- **`pushsubscriptionchange` no se implementa**: el backend no documenta nada y
  el service worker no tiene el JWT para volver a registrar la suscripción. La
  app re-sincroniza al abrirse.

### Desarrollo con service worker

`vite.config.ts` activa `devOptions: { enabled: true, type: 'module' }`, así que
`pnpm dev` en `localhost:3001` también registra el service worker (como módulo) y
se puede probar la activación y el push. En producción se emite `dist/sw.js`
clásico y se registra con `type: 'classic'`.

---

## 4. Estados

`useNotificaciones()` devuelve `estado`, `ocupado`, `error`, `permiso`,
`plataforma`, `standalone`, `soportePush`, `activar()`, `desactivar()` y
`reintentar()`.

| Estado | Cuándo |
|---|---|
| `no_soportado` | Falta `serviceWorker`, `PushManager` o `Notification` (por ejemplo iOS < 16.4). |
| `requiere_instalacion` | iOS/iPadOS abierto en Safari, sin `display-mode: standalone`. |
| `permiso_pendiente` | Hay soporte, el permiso es `default` (o `granted` sin suscripción en el navegador). |
| `denegado` | `Notification.permission === 'denied'`. |
| `activando` | Entre `activar()` y la respuesta del backend. |
| `activo` | Permiso concedido y suscripción existente y registrada. |
| `error` | Falló la activación (red, backend, suscripción). |

El permiso **solo** se pide dentro de `activar()`, que está atado a un clic, y es
la primera operación asíncrona (sin esperas previas) para no perder el gesto.

`activar()`:

1. `Notification.requestPermission()` (si ya estaba concedido no muestra nada).
2. `GET /barbero/push/llave-publica` → `claveVapidABytes()`.
3. `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` o
   reutiliza la suscripción existente.
4. `POST /barbero/push/suscripciones`.
5. Toast "Notificaciones activadas" y estado `activo`.

Si el backend falla, el estado queda en `error` (nunca en `activo`) y el botón
permite reintentar.

`desactivar()`: `DELETE /barbero/push/suscripciones` (tolera 404) y
`suscripcion.unsubscribe()`.

### Sincronización y cierre de sesión

- Al entrar o abrir la app con permiso concedido se reenvía la suscripción
  existente (`POST` idempotente). Cubre el cambio de barbero en el mismo equipo.
- Al cerrar sesión se ejecuta un `DELETE` **sin** anular la suscripción del
  navegador: el barbero que entre después la recupera solo. Si falla, el cierre
  de sesión continúa (`Promise.allSettled`).

---

## 5. Política de "Hacerlo después"

- Se guarda en `localStorage` con la clave `klippflow.onboarding.instalacion`
  como `{ "descartadoEn": "<ISO>" }`.
- Se vuelve a ofrecer a las **24 h** o antes si no hay marca.
- Nunca se ofrece si el permiso ya es `granted` o `denied`.
- En iPhone sin instalar se ofrece el onboarding completo; en iPhone instalado,
  Android y escritorio, solo la activación.
- La pantalla nunca bloquea: escribir `/app/hoy` o pulsar "Hacerlo después" /
  "Ahora no" lleva a Hoy.

Para volver a ver el onboarding: borrar esa clave en DevTools o esperar 24 h.

---

## 6. Mapa de errores

| Origen | Mensaje | Estado |
|---|---|---|
| `NotAllowedError` / permiso denegado | "Bloqueaste las notificaciones…" | `denegado` |
| Sin soporte | "Este navegador no permite notificaciones." | `no_soportado` |
| `AbortError` / `InvalidStateError` / `NotSupportedError` | "No pudimos activar las notificaciones. Inténtalo de nuevo." | `error` |
| 401 | "Tu sesión expiró. Vuelve a iniciar sesión." (el cliente redirige) | `error` |
| 400 | Mensaje de la API | `error` |
| 429 | "Demasiados intentos, espera un momento." | `error` |
| Red | "No pudimos conectar. Revisa tu internet." | `error` |
| Service worker no disponible en 8 s | "La app todavía no está lista para notificaciones…" | `error` |

---

## 7. Qué NO se implementó

- `POST /barbero/push/probar` ("Enviar prueba"): fuera del alcance de este
  prompt. El endpoint existe y está documentado.
- Push al cliente, panel de administración, cambio de contraseña y pagos.
- `pushsubscriptionchange` (ver §3).

---

## 8. Lista de comprobación en iPhone real (pendiente de despliegue)

Requiere **HTTPS** (o `localhost`), iOS/iPadOS **16.4 o superior** y la PWA
instalada en la pantalla de inicio. Nada de esto se ha podido probar todavía.

1. Servir el frontend construido (`pnpm build` + servidor estático) en el dominio
   real con HTTPS y el backend con `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y
   `VAPID_SUBJECT` configurados.
2. Abrir la URL en **Safari** (no en Chrome ni en un navegador incrustado) e
   iniciar sesión.
3. Comprobar que aparece `/instalar` con los cuatro pasos y el paso 04 atenuado
   con la nota "Disponible cuando abras la app desde el ícono".
4. Compartir → "Añadir a pantalla de inicio" → abrir KlippFlow desde el ícono.
5. Verificar que abre sin la barra de Safari (`display-mode: standalone`) y que
   Ajustes → Notificaciones dice "Desactivadas" (no "Requiere instalar la app").
6. Pulsar "Activar notificaciones" y aceptar el diálogo de iOS.
7. Confirmar `SELECT id, usuario_id, LEFT(endpoint, 30) FROM push_subscriptions`
   con el barbero correcto.
8. Con la app cerrada, crear una cita pública y comprobar que la notificación
   llega al iPhone con "Nueva solicitud de cita" y "Nombre · hoy 3:30 p. m.".
9. Tocar la notificación: debe abrir la app en `/app/solicitudes`.
10. Con la app abierta en primer plano, repetir el paso 8 y comprobar que la
    notificación se muestra igual y que la lista de Solicitudes se actualiza sola.
11. Cerrar sesión y entrar con otro barbero: comprobar con SQL que el `endpoint`
    quedó asociado al segundo barbero.
12. Denegar el permiso y comprobar que Ajustes muestra "Bloqueadas" y que la app
    no vuelve a pedirlo automáticamente.

Límites conocidos:

- En iPhone **sin instalar** no hay push aunque el permiso exista: la pantalla lo
  explica y no ofrece el botón de activación.
- En iOS **< 16.4** falta `PushManager`: la app muestra el mensaje de "no
  soportado" y funciona sin notificaciones.
- El permiso concedido en Safari **no** se hereda a la app instalada hasta que se
  pulsa "Activar notificaciones" dentro de la PWA instalada.

---

## 9. Pruebas manuales (backend en `http://localhost:3000`)

### 9.1 SELECT "antes" (sin claves completas)

```sql
SET @barbero := 1;

SELECT id, usuario_tipo, usuario_id, LEFT(endpoint, 30) AS endpoint_inicio, created_at
  FROM push_subscriptions
 WHERE usuario_tipo = 'barbero' AND usuario_id = @barbero
 ORDER BY id;
```

Guarda los `id` que aparecen.

### 9.2 Limpieza

```sql
SET @barbero := 1;

-- 1) Ver el estado actual
SELECT id, usuario_tipo, usuario_id, LEFT(endpoint, 30) AS endpoint_inicio, created_at
  FROM push_subscriptions
 WHERE usuario_tipo = 'barbero' AND usuario_id = @barbero
 ORDER BY id;

-- 2) Borrar las suscripciones creadas durante la prueba
--    (las que NO estaban en "antes"). Sustituye los ids.
DELETE FROM push_subscriptions
 WHERE usuario_tipo = 'barbero' AND usuario_id = @barbero
   AND id NOT IN (/* ids del SELECT "antes" separados por coma */ 0);

-- 3) Comprobar que quedó igual que "antes"
SELECT id, usuario_tipo, usuario_id, LEFT(endpoint, 30) AS endpoint_inicio, created_at
  FROM push_subscriptions
 WHERE usuario_tipo = 'barbero' AND usuario_id = @barbero
 ORDER BY id;
```

Para que no se vuelva a crear sola: **antes** de ejecutar el borrado, pulsa
"Desactivar" en Ajustes → Notificaciones (o DevTools → Application → Service
Workers → Push → *Unsubscribe*). Si no, la próxima apertura de la app reenvía la
suscripción existente y vuelve a crear la fila.

### 9.3 Guion

| # | Qué hacer | Qué debes ver |
|---|---|---|
| a | `pnpm lint`, `pnpm test` (también `TZ=UTC` y `TZ=Asia/Tokyo`), `pnpm build`. | 0 errores; 317 pruebas en verde; `dist/sw.js` existe. |
| b | Chrome de escritorio en `localhost:3001`: login. | Onboarding reducido con "Activar notificaciones"; al aceptar aparece la fila en `push_subscriptions` con el barbero correcto y Ajustes muestra "Activas". |
| c | Crear una cita pública en otra pestaña. | Llega la notificación del sistema "Nueva solicitud de cita" + "Nombre · …"; al hacer clic se abre/enfoca la app en `/app/solicitudes`. |
| d | Con la app abierta y en primer plano, crear otra cita. | La notificación del sistema también aparece y la lista de Solicitudes se refresca sola. |
| e | Desactivar el permiso en el navegador (icono del candado) y pulsar "Activar". | Mensaje de bloqueado, sin reintentos automáticos; Ajustes muestra "Bloqueadas". |
| f | "Hacerlo después" y luego recargar; después cambiar `descartadoEn` a hace 25 h. | Entra a Hoy; al recargar no vuelve a salir; con la fecha vieja vuelve a ofrecerse. |
| g | Apagar el backend y pulsar "Activar". | Error visible, el estado no queda en "Activo"; al volver el backend el reintento funciona. |
| h | Cerrar sesión y entrar con barbero2. | El `endpoint` queda con `usuario_id` de barbero2; barbero1 ya no tiene esa fila. |
| i | Doble clic rápido en "Activar notificaciones". | Una sola petición a `/barbero/push/suscripciones` en Network. |
| j | Simular un navegador sin soporte (DevTools o la prueba unitaria de `plataforma`). | Mensaje honesto y la app sigue funcionando. |
| k | DevTools → Application → Service Workers; recargar tras un `pnpm build`. | El SW se actualiza (`skipWaiting` + `clients.claim`), sin quedarse con la versión vieja. |
| l | Revisar a 390 px y navegar con teclado. | Sin scroll horizontal, objetivos ≥ 40 px, foco visible y lógico. |
| m | Prueba en iPhone real. | Ver §8 (pendiente de despliegue). |
| n | `git status` y búsqueda de `#hex` y de la llave privada VAPID. | Sin `.env`, `node_modules` ni `dist`; sin hex fuera de `tokens.css`; sin `VAPID_PRIVATE_KEY` en el repo. |
