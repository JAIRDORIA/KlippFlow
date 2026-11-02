# Panel de administración (`/admin`)

Prompt 7 del frontend. Login de administrador, lista de barberos, alta de
barberos, cambio de estado, rotación del código y restablecimiento de contraseña.

Fuentes de verdad:

- `docs/backend/ADMIN.md` (endpoints y reglas)
- `docs/backend/AUTH.md` (login de admin, JWT y aislamiento de roles)
- `docs/DISENO.md` §6.12 y §9
- `PROJECT_CONTEXT.md`

No se inventó ningún campo. Todas las llamadas usan el token de la zona `admin`
(`klippflow.admin.sesion`), que es distinto del de barbero.

---

## 1. Estructura

```text
src/features/admin/
  types.ts                        BarberoAdmin, ListaBarberos, cuerpos
  api.ts                          login + /admin/barberos (GET, POST, PATCH, POST)
  claves.ts                       ['admin','barberos']
  hooks.ts                        useBarberos, useAdminLogin y mutaciones
  AdminLoginPage.tsx              /admin/login
  AdminListaPage.tsx              /admin
  components/
    MetaNoIndex.tsx               asegura robots noindex
    PildoraEstado.tsx             coloreada solo con tokens + texto
    SecretoCopiable.tsx           dato de una sola vez + Copiar
    useCopiar.ts                  portapapeles con respaldo
    SheetNuevoBarbero.tsx         alta + entrega de datos
    SheetDetalleBarbero.tsx       estado, rotar código, restablecer
  domain/
    password.ts                   contraseña provisional (crypto.getRandomValues)
    formulario.ts                 validación con los límites del backend
    texto.ts                      normalización y búsqueda sin acentos
    lista.ts                      filtros, conteos y orden
    estado.ts                     etiqueta, color y efecto de cada estado
    errores.ts                    mapa de errores en español
    enlaces.ts                    link público `/b/{codigo}`
    entrega.ts                    texto para WhatsApp
    *.test.ts
src/features/auth/
  sesionAdmin.ts                  cargar/guardar/borrar la sesión del admin
  admin-auth-context.ts           contexto propio
  AdminAuthProvider.tsx           login, logout y limpieza de caché
  useAdminAuth.ts
  ProtectedAdminRoute.tsx         guard de /admin/*
```

---

## 2. Sesión separada del barbero

| | Barbero | Administrador |
|---|---|---|
| Clave | `klippflow.barbero.sesion` | `klippflow.admin.sesion` |
| `tipo` del JWT | `barbero` | `admin` |
| Guard | `ProtectedRoute` | `ProtectedAdminRoute` |
| Endpoints | `/barbero/...` | `/admin/...` |

- `sesionAdmin.ts` valida `tipo === 'admin'` y `exp` al leer: un token de barbero
  guardado en la clave del admin se descarta.
- Cerrar una sesión solo borra su clave (`cerrarSesionLocal('admin', …)`), así
  que la del barbero sigue intacta, y al revés.
- Un 401 en una petición de zona `admin` dispara
  `cerrarSesionLocal('admin','expirada')` + redirección a
  `/admin/login?motivo=sesion-expirada`; el provider reacciona al evento, deja
  la sesión en null y **solo** borra las consultas `['admin', …]`.
- Cerrar sesión desde la lista es inmediato: el guard detecta la falta de sesión
  y manda a `/admin/login`.

---

## 3. Datos y claves de consulta

```ts
clavesAdmin.barberos = ['admin', 'barberos']
```

- `useBarberos()` pide `GET /admin/barberos?pagina=1&limite=50` (el máximo del
  backend) y filtra, ordena y cuenta en el cliente. Motivo: el backend filtra
  por `username` y `nombre_barberia`, pero **no** por nombres ni apellidos, y no
  devuelve conteos por estado.
- `useCrearBarbero`, `useCambiarEstado`, `useRotarCodigo` y
  `useRestablecerClave` invalidan `['admin','barberos']` al terminar (y también
  ante 404/409, porque el estado del servidor cambió).
- `useAdminLogin` envuelve `login()` del provider; el 401 del login **no**
  redirige (se muestra el mensaje).

---

## 4. Secretos de una sola vez

| Dato | Dónde vive | Dónde NO vive |
|---|---|---|
| Contraseña del barbero nuevo | estado de `SheetNuevoBarbero` | caché de TanStack Query, `localStorage`, URL |
| Contraseña restablecida | estado de `SheetDetalleBarbero` | ídem |
| Código rotado | estado de `SheetDetalleBarbero` | ídem |

- El backend **no genera ni devuelve** contraseñas: el panel propone una con
  `crypto.getRandomValues` y la envía. Por eso "solo se muestra ahora": no hay
  forma de recuperarla después.
- Los sheets se montan al abrirse y se desmontan al cerrarse
  (`{abierto && <Sheet…/>}`), así que el estado con los secretos se destruye al
  cerrar. Ni siquiera queda en memoria del componente.
- El bloque con los datos lleva `aria-live="polite"` para anunciarse una vez al
  aparecer; los campos no son regiones vivas, así que no se releen al enfocar.

---

## 5. Pantallas

### `/admin/login`

Eyebrow "SOLO ADMINISTRADOR", título "Administración", logo provisional, campos
Usuario y Contraseña (con ver/ocultar), botón "Entrar" y el error del backend.
Sin enlaces a ninguna otra parte de la app. `MetaNoIndex` garantiza
`robots: noindex` (el `index.html` ya lo trae para toda la app).

### `/admin`

- Contenedor `max-w-[900px]` centrado, usable a 390 px.
- Eyebrow "ADMINISTRACIÓN", título "Barberos", "+ Nuevo barbero" y "Cerrar
  sesión" discreto.
- Buscador (nombre, apellidos, barbería o usuario, sin acentos) y chips
  Todos / Activos / Suspendidos / Vencidos con conteo.
- Filas: nombre, barbería, `usuario · código` en mono y píldora de estado.
- Estados: skeleton, error con "Reintentar", "Aún no hay barberos" (lista vacía)
  y "Sin resultados" (con "Limpiar filtros").
- Si hay más de 50 barberos se avisa: "Mostrando los primeros 50 de N".

### Sheet "Nuevo barbero"

Nombre, Apellidos, Barbería (opcional), Usuario, Correo (obligatorio en el
backend) y Contraseña con "Generar contraseña" y ver/ocultar.

Al crear: vista "Entrega estos datos al barbero" con usuario, contraseña, código
y link, cada uno con "Copiar", más "Copiar todo" (texto listo para WhatsApp) y el
aviso "La contraseña solo se muestra ahora".

### Sheet "Detalle de barbero"

Datos, código y link (con "Abrir como cliente" y "Copiar"), control segmentado
Activo / Suspendido / Vencido (cambiar pide confirmación y explica el efecto),
"Rotar código" y "Restablecer contraseña", ambos con confirmación explícita y con
el resultado mostrado una sola vez.

---

## 6. Mapa de errores

| Caso | Mensaje |
|---|---|
| 401 (en el panel) | "Sesión de administrador vencida. Vuelve a entrar." + redirección |
| 401 (en el login) | "Usuario o contraseña incorrectos" |
| 403 | Mensaje de la API o "No tienes permiso para esta acción." |
| 403 (login) | "Tu cuenta de administrador no está activa." |
| 400 | Mensaje de la API (o el primer campo) |
| 404 | "Ese barbero ya no existe." |
| 409 usuario/correo | "Ese usuario o correo ya existe." |
| 409 código único | Mensaje de la API |
| 429 | "Demasiados intentos, espera un momento." |
| Red | "No pudimos conectar. Revisa tu internet." |

---

## 7. Límites conocidos

- La lista no pagina: se piden 50 (máximo del backend) y se avisa si hay más.
  No hay "Cargar más" porque el prompt no lo pidió.
- `PATCH /admin/barberos/:id/estado` no documenta el cuerpo de la respuesta: no
  se usa; la UI aplica el estado elegido y la lista se invalida.
- Restablecer la contraseña **no revoca los tokens ya emitidos** (expiran solos).
- No se puede cambiar el estado de un barbero con un solo toque: siempre hay
  confirmación.
- Sin endpoint para eliminar barberos (no se implementa).
- Fuera de alcance: servicios u horarios de otros barberos, citas, finanzas,
  anticipos, pagos y push del admin.

---

## 8. Pruebas manuales

Backend en `http://localhost:3000`, frontend en `http://localhost:3001`.

### 8.1 SELECT "antes"

```sql
-- Barbero(s) de prueba y sus datos (sin el hash)
SELECT id, codigo_unico, nombres, apellidos, nombre_barberia, username, correo,
       estado_cuenta, created_at
  FROM barberos
 ORDER BY id;

-- Admins (sin el hash)
SELECT id, username, nombre, activo, creado_en
  FROM admins
 ORDER BY id;
```

Guarda esta salida: es el estado al que hay que volver.

### 8.2 Limpieza

```sql
-- 1) Ver qué se va a borrar
SELECT id, username, correo, estado_cuenta
  FROM barberos
 WHERE username LIKE 'test-%';

-- 2) Ver si esos barberos tienen datos dependientes
SELECT 'citas' AS tabla, COUNT(*) AS filas FROM citas WHERE barbero_id IN
       (SELECT id FROM barberos WHERE username LIKE 'test-%')
UNION ALL
SELECT 'atenciones', COUNT(*) FROM atenciones WHERE barbero_id IN
       (SELECT id FROM barberos WHERE username LIKE 'test-%')
UNION ALL
SELECT 'compras', COUNT(*) FROM compras WHERE barbero_id IN
       (SELECT id FROM barberos WHERE username LIKE 'test-%')
UNION ALL
SELECT 'horarios_trabajo', COUNT(*) FROM horarios_trabajo WHERE barbero_id IN
       (SELECT id FROM barberos WHERE username LIKE 'test-%')
UNION ALL
SELECT 'servicios', COUNT(*) FROM servicios WHERE barbero_id IN
       (SELECT id FROM barberos WHERE username LIKE 'test-%')
UNION ALL
SELECT 'push_subscriptions', COUNT(*) FROM push_subscriptions
 WHERE usuario_tipo = 'barbero' AND usuario_id IN
       (SELECT id FROM barberos WHERE username LIKE 'test-%');

-- 3) Borrar primero las hijas y al final el barbero
--    (si alguna FK no tiene ON DELETE CASCADE, este es el orden correcto)
DELETE FROM citas              WHERE barbero_id IN (SELECT id FROM barberos WHERE username LIKE 'test-%');
DELETE FROM atenciones         WHERE barbero_id IN (SELECT id FROM barberos WHERE username LIKE 'test-%');
DELETE FROM compras            WHERE barbero_id IN (SELECT id FROM barberos WHERE username LIKE 'test-%');
DELETE FROM balance_resumen_diario WHERE barbero_id IN (SELECT id FROM barberos WHERE username LIKE 'test-%');
DELETE FROM horarios_trabajo   WHERE barbero_id IN (SELECT id FROM barberos WHERE username LIKE 'test-%');
DELETE FROM servicios          WHERE barbero_id IN (SELECT id FROM barberos WHERE username LIKE 'test-%');
DELETE FROM push_subscriptions
 WHERE usuario_tipo = 'barbero'
   AND usuario_id IN (SELECT id FROM barberos WHERE username LIKE 'test-%');
DELETE FROM barberos           WHERE username LIKE 'test-%';

-- 4) Confirmar que quedó como en "antes"
SELECT id, codigo_unico, nombres, apellidos, nombre_barberia, username, correo,
       estado_cuenta, created_at
  FROM barberos
 ORDER BY id;

SELECT id, username, nombre, activo, creado_en FROM admins ORDER BY id;
```

> Si `citas` tiene hijas (`cita_personas`, `cita_persona_servicios`) sin
> `ON DELETE CASCADE`, bórralas antes por `cita_id`. La consulta del paso 2 te
> dice si hay algo pendiente.

### 8.3 Guion

| # | Qué hacer | Qué debes ver |
|---|---|---|
| a | `pnpm lint`, `pnpm test` (también `TZ=UTC` y `TZ=Asia/Tokyo`), `pnpm build`. | 0 errores; 392 pruebas en verde. |
| b | `/admin/login` con credenciales buenas, malas y 6 intentos seguidos. | Entra en `/admin`; con malas "Usuario o contraseña incorrectos"; al sexto, mensaje de demasiados intentos. |
| c | Con sesión de barbero abrir `/admin`; con sesión de admin abrir `/app`; cerrar una sesión. | El barbero va a `/admin/login` y el admin a `/login`; cerrar una no cierra la otra. |
| d | Crear `test-uno`. | Aparece en la lista; los datos de entrega se ven una sola vez; al cerrar y reabrir el detalle ya no está la contraseña; `test-uno` entra en `/login`. |
| e | Crear con el mismo usuario. | "Ese usuario o correo ya existe." y el formulario conserva lo escrito. |
| f | Suspender `test-uno` y probar su login y su link público; reactivar. | Login 403 solo con contraseña correcta; el link avisa que no hay reservas; al reactivar todo vuelve. |
| g | Marcarlo vencido. | Igual que suspendido. |
| h | Rotar el código. | El link anterior da 404, el nuevo funciona y el código nuevo se muestra una sola vez. |
| i | Restablecer la contraseña. | La anterior deja de servir y la nueva entra. |
| j | Buscar "nunez" y filtrar por estados. | Encuentra "Núñez" y los conteos de los chips cuadran. |
| k | Doble clic en Crear, Rotar y Restablecer. | Una sola petición en Network. |
| l | Apagar el backend. | Lista con error y "Reintentar"; la mutación fallida conserva lo escrito y no muestra secretos. |
| m | Alterar o vencer el token del admin. | Redirige a `/admin/login` sin pantallas rotas. |
| n | Revisar DevTools → Application y la URL tras crear y restablecer. | Ningún secreto en `localStorage`, `sessionStorage`, URL ni en la caché de React Query. |
| o | Revisar a 390 px y en escritorio; navegar con teclado. | Sin scroll horizontal, objetivos ≥ 40 px, foco atrapado en los sheets, Esc cierra y el foco vuelve. |
| p | `git status` y búsqueda de `#hex`. | Sin `.env`, `node_modules` ni `dist`; sin hex fuera de `tokens.css`. |
