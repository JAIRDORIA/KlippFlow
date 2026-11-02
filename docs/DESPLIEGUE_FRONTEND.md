# Despliegue del frontend (Vercel)

Pasos para publicar KlippFlow en Vercel y qué hay que ajustar en el backend.
Sin valores reales: los dominios de los ejemplos son de mentira.

---

## 0. Caso actual de KlippFlow (noviembre 2026)

- Backend ya desplegado en Clever Cloud:
  `https://app-09b36103-6e0a-40a5-b984-06c43f12e2f8.cleverapps.io`
  (sin barra final).
- Frontend: este repositorio, rama `main`, importado en Vercel.
- Variables en Vercel:

  | Variable | Valor | Entornos |
  |---|---|---|
  | `VITE_API_URL` | `https://app-09b36103-6e0a-40a5-b984-06c43f12e2f8.cleverapps.io` | Production y Preview |
  | `VITE_APP_PUBLIC_URL` | el dominio de producción que asigne Vercel (p. ej. `https://klippflow-frontend.vercel.app`) | Production |

  `VITE_APP_PUBLIC_URL` es opcional: si falta, los links usan el origen actual.
  Si se agrega o se cambia, hay que volver a desplegar.

- En Clever Cloud, **después** de conocer el dominio de Vercel:
  1. `APP_PUBLIC_URL` = ese dominio, sin barra final.
  2. CORS (`main.ts`): hoy el backend permite **un solo** origen
     (`APP_PUBLIC_URL`). Las URLs de *preview* de Vercel (`*.vercel.app`)
     fallarán hasta que se agreguen al arreglo de CORS; por eso el flujo real
     se prueba sobre el dominio de producción.
  3. Reiniciar la app para que tome las variables.

---

## 1. Antes de nada

- El repositorio del frontend ya trae `vercel.json`, así que Vercel detecta todo.
- Node 22 (el mismo que se usa en local). En Vercel: *Settings → General → Node
  Version*.
- El backend debe estar publicado **con HTTPS** y con CORS abierto para el
  dominio del frontend (ver §4). Sin eso, la app carga pero no puede entrar.

---

## 2. Crear el proyecto en Vercel

1. *Add New… → Project* e importar el repositorio del frontend.
2. Configuración (la de `vercel.json`, por si hay que escribirla a mano):
   - **Framework preset**: Vite
   - **Build command**: `pnpm build`
   - **Output directory**: `dist`
   - **Install command**: `pnpm install` (Vercel detecta `pnpm-lock.yaml`)
3. *Root directory*: la raíz del repo (no hay monorepo).
4. Variables de entorno (§3) antes del primer deploy de producción.

---

## 3. Variables de entorno

En *Settings → Environment Variables* (Production, Preview y Development):

| Nombre | Ejemplo | Obligatoria |
|---|---|---|
| `VITE_API_URL` | `https://api.tudominio.com` | Sí |
| `VITE_APP_PUBLIC_URL` | `https://app.tudominio.com` | No (si falta se usa el origen actual) |

- Las dos empiezan por `VITE_` porque Vite las inyecta en el bundle; **no**
  pongas secretos ahí (todo lo `VITE_` acaba en el JavaScript público).
- Se leen en `src/shared/api/client.ts` (`VITE_API_URL`) y en
  `src/features/admin/domain/enlaces.ts` (`VITE_APP_PUBLIC_URL`). No hay ninguna
  URL escrita en el código.
- Cambiar una variable exige **redeploy**: se hornea en el build.

---

## 4. Cambios en el backend

En el `.env` del backend (Clever Cloud u otro):

1. `APP_PUBLIC_URL` → el dominio real del frontend, sin barra final:
   `APP_PUBLIC_URL=https://app.tudominio.com`. Se usa para armar los links
   `/b/{codigo}` y `/cita/{token}` de WhatsApp y del panel de admin.
2. **CORS**: `main.ts` habilita el origen con `origin: [appPublicUrl]`. Si el
   frontend también se abre en un dominio de *preview* de Vercel
   (`*.vercel.app`), hay que añadirlo a esa lista o los navegadores bloquearán
   las peticiones. Se recomienda:
   - producción: el dominio propio;
   - preview: el dominio estable del proyecto o probar con el de producción.
3. Si el backend está detrás de un proxy (Clever Cloud), `trust proxy` ya está
   configurado; el throttling cuenta bien la IP.
4. Reiniciar el backend tras cambiar el `.env`.

---

## 5. Qué hace `vercel.json`

- **Rewrites**: cualquier ruta que no sea un archivo estático sirve
  `index.html`, para que `/b/CODIGO`, `/cita/TOKEN`, `/app/*` y `/admin/*`
  funcionen al recargar o al abrir un link directo.
- **Caché**:
  - `/assets/*` → `public, max-age=31536000, immutable` (tienen hash)
  - `/index.html`, `/sw.js` y `/manifest.webmanifest` → `no-cache`
- **Seguridad**: `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- **`X-Robots-Tag: noindex, nofollow`** en todo (la app no se indexa).
- **Sin** `Content-Security-Policy` a propósito: se añadirá cuando se pida.

El nombre del service worker (`sw.js`) y del manifest
(`manifest.webmanifest`) son los que emite `vite build`; si algún día cambian,
hay que actualizar esas reglas.

---

## 6. Dominio y HTTPS

1. *Settings → Domains* → añadir el dominio y seguir el DNS que indique Vercel.
2. Con HTTPS, la PWA ya es instalable (requisito de iOS y Android).
3. Tras el primer deploy:
   - abrir `https://app.tudominio.com/manifest.webmanifest` y comprobar que
     responde el JSON;
   - abrir `/sw.js` y comprobar que responde el service worker;
   - recargar en `/b/CODIGO` y en `/app/cuentas` para verificar las reescrituras.

---

## 7. Orden recomendado de despliegue

1. Desplegar el backend con `APP_PUBLIC_URL` y CORS del dominio del frontend.
2. Desplegar el frontend con `VITE_API_URL` apuntando al backend.
3. Probar login, reserva pública y push en el navegador.
4. Recién entonces hacer la prueba en iPhone real (`docs/PWA.md` §6).

---

## 8. Checklist rápido

- [ ] `pnpm build` pasa en local.
- [ ] Variables `VITE_API_URL` y (opcional) `VITE_APP_PUBLIC_URL` cargadas.
- [ ] Backend con `APP_PUBLIC_URL` y CORS del dominio real.
- [ ] Recarga directa en `/b/CODIGO`, `/cita/TOKEN`, `/app/cuentas` y `/admin`
      sin 404.
- [ ] `/manifest.webmanifest` y `/sw.js` responden y sin caché.
- [ ] Instalación en Android e iPhone, e ícono correcto en la pantalla de inicio.
- [ ] Push llega y la suscripción sigue en `push_subscriptions` tras actualizar.
