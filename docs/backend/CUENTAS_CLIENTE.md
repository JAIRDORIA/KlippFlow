# Cuentas de cliente: registro, Google, login unificado y citas con sesión

El cliente puede crear su cuenta de **dos formas**:

1. **Registro directo** — `POST /auth/cliente/registro` con
   `nombre + username + contraseña + celular + correo`. El correo es
   **obligatorio y único**; la cuenta queda sin sesión hasta confirmar un
   **código de 6 dígitos** enviado a ese correo.
2. **Con Google** — `POST /auth/cliente/google` verifica correo y nombre;
   si la identidad es nueva devuelve un `registroToken` y luego
   `POST /auth/cliente/completar-cuenta` completa
   `username + contraseña + celular`. El correo de Google ya viene verificado.

En el registro directo la cuenta se crea con `correo_verificado = 0`. Hasta
confirmar el código no se permite iniciar sesión ni recuperar contraseña. Una
vez verificado, el login es el **login unificado** (barbero o cliente: el rol
sale de quién es el usuario). Con su sesión guarda barberos, reserva y consulta
sus citas.

Base URL: `http://localhost:3000`. Todo JSON; `ValidationPipe` global con
`whitelist` + `forbidNonWhitelisted` + `transform`.

- Los endpoints de **auth** son públicos y tienen throttle.
- Los endpoints `/cliente/...` requieren `Authorization: Bearer <accessToken>`
  de un cliente (`@Roles('cliente')`). El `clienteId` sale **siempre del JWT**
  (`@CurrentClienteId()`); enviarlo en el body da **400** y un recurso de otro
  cliente da **404**.

---

## 1. Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `GOOGLE_CLIENT_ID` | No (perezosa) | Client ID del proyecto Google para verificar `idToken`. Si falta, la app arranca y `POST /auth/cliente/google` responde **503**. |
| `EMAIL_MODO` | No | `consola` (default en desarrollo) imprime el código en el log; `smtp` (default en producción) envía correo real. |
| `SMTP_HOST` | Si `EMAIL_MODO=smtp` | Servidor SMTP. |
| `SMTP_PORT` | No | Puerto SMTP; default `587`. |
| `SMTP_SECURE` | No | `true` para TLS implícito (puerto 465). Default `false` (STARTTLS). |
| `SMTP_USER` / `SMTP_PASS` | No | Credenciales si el servidor SMTP las exige. |
| `SMTP_FROM` | Si `EMAIL_MODO=smtp` | Remitente, por ejemplo `KlippFlow <no-reply@klippflow.com>`. |

La verificación de correo y la recuperación de contraseña envían un **código
de 6 dígitos**; no se envía ningún enlace. El frontend solo necesita mostrar un
campo para ingresar el código.

No escribas el valor real en documentación.

---

## 2. Reglas de dominio

### Username de cliente

- Se normaliza a **minúsculas** antes de validar y guardar.
- De **4 a 20** caracteres, solo `[a-z0-9._]`.
- No puede empezar ni terminar en `.` o `_`, ni contener `..`.
- Reservados (400): `admin`, `root`, `soporte`, `klippflow`, `barbero`,
  `cliente`, `api`, `public`.
- Debe estar libre en `barberos`, `clientes` y `admins` (comparación sin
  distinguir mayúsculas). Si un barbero/admin/cliente ya lo tiene → **409**
  `Ese usuario ya está en uso`.

### Contraseña

- De **8 a 72** caracteres (límite de bcrypt).
- Debe ser **distinta del username**.

### Celular

- Se reutiliza la normalización existente: se quitan no-dígitos; si quedan 12
  y empiezan por `57`, se quita el `57`; el resultado debe cumplir `^3\d{9}$`.
- `+57 300 123 4567` → `3001234567`. Inválido → **400** `Celular inválido`.

### Registro (completar cuenta)

- El `registroToken` dura **15 minutos** y **solo sirve para completar la
  cuenta**. Su `tipo` es `registro_cliente`; `JwtStrategy` lo **rechaza**
  siempre como token de sesión.
- La identidad se guarda con `UNIQUE(proveedor, subject)` y
  `UNIQUE(cliente_id, proveedor)`. **La llave de identidad es `sub`, nunca el
  correo.** No se vinculan cuentas por coincidencia de correo.

### Registro directo

- `POST /auth/cliente/registro` aplica las mismas reglas de username,
  contraseña y celular.
- `correo` es **opcional** y no se verifica; se guarda en minúsculas.
- No crea fila en `cliente_identidades` y la sesión sale con
  `metodo: 'password'`.

### Sesión JWT

```json
{ "sub": 1, "tipo": "barbero", "username": "barbero1", "metodo": "password" }
```

- `metodo` ∈ `'password' | 'google'`. Para barbero y admin siempre
  `'password'`.
- `JwtStrategy` rechaza cualquier `tipo` distinto de `barbero`, `cliente` o
  `admin`; además valida en cada petición que el barbero siga `activo` (403),
  y que el cliente/admin sigan existiendo y activos (401).

---

## 3. Endpoints de autenticación

### POST /auth/login (unificado)

Body:

```json
{ "usuario": "barbero1", "contrasena": "TuClave123" }
```

- Throttle: **10 por minuto por IP**.
- Busca **primero en barberos y luego en clientes**, por username normalizado
  (minúsculas). Compara con bcrypt; si el usuario no existe usa un hash
  dummy para igualar tiempos.
- Fallo de usuario o contraseña → **401** `Usuario o contraseña incorrectos`
  (idéntico en todos los casos).
- Barbero suspendido/vencido, cliente desactivado o cliente con correo sin
  verificar → **403** **después** de validar la contraseña.

Respuesta barbero **200**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "tipo": "barbero",
  "barbero": {
    "id": 1,
    "codigoUnico": "BARB-0001",
    "nombres": "Barbero",
    "apellidos": "Prueba",
    "nombreBarberia": "Barbería Demo",
    "username": "barbero1",
    "estadoCuenta": "activo"
  }
}
```

Respuesta cliente **200**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "tipo": "cliente",
  "cliente": {
    "id": 2,
    "nombre": "Cliente",
    "username": "test_cliente",
    "correo": "cliente@example.com",
    "celular": "3001112233"
  }
}
```

### POST /auth/cliente/registro

Crea la cuenta **sin pasar por Google**. El `correo` es **obligatorio y
único**. La cuenta se crea sin sesión y con `correo_verificado = 0`; se envía
un código de 6 dígitos a ese correo.

Body:

```json
{
  "nombre": "Cliente Nuevo",
  "username": "nuevo_cliente",
  "contrasena": "ClaveSegura123",
  "celular": "+57 300 111 2233",
  "correo": "nuevo@example.com"
}
```

| Campo | Obligatorio | Reglas |
|---|---|---|
| `nombre` | Sí | 1–100 caracteres (se recorta) |
| `username` | Sí | mismas reglas que completar-cuenta |
| `contrasena` | Sí | 8–72 y distinta del username |
| `celular` | Sí | normalización colombiana (`^3\d{9}$`) |
| `correo` | **Sí** | email válido, máx. 255; se guarda en minúsculas; **único** |

- Throttle: **5 por 10 minutos por IP**.
- Crea el cliente con `activo = true`, `correo_verificado = 0` y **sin** fila
  en `cliente_identidades` (no hay identidad externa).
- Genera un código de 6 dígitos, válido **15 minutos**, máximo **5 intentos**.
  En la base solo se guarda el HMAC-SHA-256 del código.
- **No devuelve `accessToken`** hasta que se verifique el correo.

Respuesta **201**:

```json
{
  "requiereVerificacion": true,
  "correo": "nuevo@example.com",
  "mensaje": "Cuenta creada. Te enviamos un código de 6 dígitos al correo para verificarla."
}
```

Errores:

| Código | Caso |
|---|---|
| 400 | campo faltante/extra, username reservado o formato inválido, contraseña inválida, celular inválido, correo inválido o vacío |
| 409 | username ya tomado (barbero, admin o cliente) |
| 409 | correo ya registrado por otra cuenta |
| 429 | más de 5 intentos en 10 minutos |

> El username se comprueba contra `clientes`, `barberos` y `admins` antes de
> insertar. El correo también se comprueba antes y, si dos peticiones compiten,
> el índice único `uq_clientes_correo` se traduce a **409** (nunca a un 500).

### POST /auth/cliente/verificar-correo

Confirma la cuenta con el código recibido por correo y devuelve la sesión.

```json
{
  "correo": "nuevo@example.com",
  "codigo": "123456"
}
```

- Throttle: **10 por 10 minutos por IP**.
- Código inválido, vencido, ya usado o con 5 intentos fallidos → **400**
  `Código inválido o vencido`.
- Correo ya verificado → **400** `El correo ya está verificado`.
- Cliente inactivo → **403**.
- Éxito → **200** con `accessToken`, `tipo: 'cliente'` y `cliente`, usando
  `metodo: 'password'` en el JWT.

### POST /auth/cliente/reenviar-codigo-verificacion

```json
{ "correo": "nuevo@example.com" }
```

- Throttle: **5 por 10 minutos por IP**.
- Respuesta **siempre 200** para no revelar si la cuenta existe:
  ```json
  {
    "ok": true,
    "mensaje": "Si la cuenta existe y no está verificada, recibirás un nuevo código."
  }
  ```
- Solo genera y envía un código nuevo si la cuenta existe, está activa, tiene
  correo y **aún no está verificada**.

### POST /auth/cliente/google

Body:

```json
{ "idToken": "eyJhbGciOiJSUzI1NiIs..." }
```

- Throttle: **10 por minuto por IP**.
- Verifica el `idToken` con `google-auth-library` y `audience =
  GOOGLE_CLIENT_ID`. Si `GOOGLE_CLIENT_ID` no está configurado → **503**
  `Inicio con Google no configurado`.
- Si `email_verified` no es `true` → **401** `Correo de Google no verificado`.
- Si la identidad existe → inicia sesión con `metodo: 'google'`.
- Si la identidad **no existe**, **no crea nada**: devuelve `registroToken` y
  el perfil para completar la cuenta.

Identidad existente **200**:

```json
{
  "requiereCompletar": false,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "tipo": "cliente",
  "cliente": {
    "id": 2,
    "nombre": "Cliente Google",
    "username": "test_google",
    "correo": "google@example.com",
    "celular": "3001112233"
  }
}
```

Identidad nueva **200**:

```json
{
  "requiereCompletar": true,
  "registroToken": "eyJhbGciOiJIUzI1NiIs...",
  "perfil": { "nombre": "Cliente Google", "correo": "google@example.com" }
}
```

### POST /auth/cliente/completar-cuenta

Body:

```json
{
  "registroToken": "eyJhbGciOiJIUzI1NiIs...",
  "username": "test_google",
  "contrasena": "ClaveSegura123",
  "celular": "+57 300 111 2233",
  "nombre": "Cliente Google"
}
```

- `nombre` es opcional; si no llega se usa el del token.
- Throttle: **5 por 10 minutos por IP**.
- Crea en **una sola transacción** el cliente + su identidad, marca el correo
  como **verificado** (Google ya lo verificó) y devuelve sesión
  `metodo: 'google'`.
- Si ese correo ya pertenece a una cuenta local → **409**; no se vinculan
  cuentas automáticamente por correo.

Respuesta **201**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "tipo": "cliente",
  "cliente": {
    "id": 2,
    "nombre": "Cliente Google",
    "username": "test_google",
    "correo": "google@example.com",
    "celular": "3001112233"
  }
}
```

Errores:

| Código | Caso |
|---|---|
| 400 | username reservado/formato inválido, contraseña inválida, celular inválido |
| 401 | `registroToken` inválido o vencido |
| 409 | username ya tomado (barbero/admin/cliente) |
| 409 | correo ya registrado por una cuenta local |
| 409 | identidad Google ya registrada (índice único) |
| 429 | más de 5 intentos en 10 minutos |

Para probar sin Google real:

```bash
node scripts/generar-registro-token.js
```

Imprime un `registroToken` firmado con el `JWT_SECRET` del `.env` (dura 15 min;
se niega a correr con `NODE_ENV=production`).

### POST /auth/cliente/recuperar-password

Inicia la recuperación de contraseña de una cuenta local. Público y con
throttle: **5 por 10 minutos por IP**.

Body:

```json
{ "identificador": "nuevo_cliente" }
```

`identificador` puede ser el **username** o el **correo** de la cuenta.

- La respuesta es **siempre 200** con el mismo mensaje, exista o no la cuenta:

```json
{
  "ok": true,
  "mensaje": "Si el usuario existe y tiene un correo verificado, recibirás un código de 6 dígitos."
}
```

- Solo se envía código si el cliente existe, está **activo**, tiene `correo` y
  el correo está **verificado**.
- Se genera un código numérico de 6 dígitos, válido **15 minutos**, máximo
  **5 intentos**. En `clientes` se guarda **solo su HMAC-SHA-256** en
  `reset_password_token_hash`.
- Un nuevo intento sobrescribe el código anterior.
- Con `EMAIL_MODO=consola` el código se imprime en el log; con `smtp` se envía
  por correo real.
- Si el envío del correo falla, el endpoint mantiene la respuesta genérica y el
  error queda en el log.

Errores:

| Código | Caso |
|---|---|
| 400 | `identificador` vacío o fuera de 3–255 caracteres |
| 429 | más de 5 intentos en 10 minutos |

### POST /auth/cliente/restablecer-password

Body:

```json
{
  "identificador": "nuevo_cliente",
  "codigo": "123456",
  "nuevaContrasena": "NuevaClave123"
}
```

- Público y con throttle: **5 por 10 minutos por IP**.
- Busca la cuenta por username o correo; debe estar activa y con correo
  verificado.
- Valida el código por HMAC-SHA-256, su caducidad y el límite de 5 intentos.
- Cada código incorrecto incrementa el contador de intentos.
- Aplica las mismas reglas de contraseña que el registro (8–72 y distinta del
  username).
- Actualiza `password_hash` y limpia el código en **una sola operación atómica**:
  el código sirve **una única vez**.
- Respuesta **200**: `{ "ok": true }`.
- Código inválido, vencido, con intentos agotados o ya usado → **400**
  `Código inválido o vencido`.

Flujo completo del frontend:

```text
1. POST /auth/cliente/recuperar-password { identificador }
2. El cliente recibe un código de 6 dígitos en su correo.
3. POST /auth/cliente/restablecer-password { identificador, codigo, nuevaContrasena }
4. Redirigir al login normal con la nueva contraseña
```

---

## 4. Endpoints del cliente (JWT `@Roles('cliente')`)

### GET /cliente/perfil

**200**:

```json
{
  "id": 2,
  "nombre": "Cliente",
  "username": "test_cliente",
  "correo": "cliente@example.com",
  "celular": "3001112233"
}
```

### PATCH /cliente/perfil

Body (al menos un campo):

```json
{ "nombre": "Cliente Nuevo", "celular": "3001112244" }
```

- `celular` se normaliza; inválido → **400** `Celular inválido`.
- Devuelve el perfil actualizado (**200**).

### PUT /cliente/contrasena

Body:

```json
{ "nuevaContrasena": "NuevaClave123", "contrasenaActual": "ViejaClave" }
```

- Si la sesión es `metodo: 'google'` y el token se emitió hace **≤ 10 minutos**
  (`iat`), se permite **sin** `contrasenaActual` (flujo de recuperación).
- En cualquier otro caso `contrasenaActual` es **obligatoria** (**400** si
  falta) y si es incorrecta → **401** `Contraseña actual incorrecta`.
- Devuelve `{ "ok": true }` (**200**).

### GET /cliente/barberos

Lista los barberos vinculados; orden: **el último con el que reservó primero**.

**200**:

```json
[
  {
    "nombre": "Barbero",
    "nombreBarberia": "Barbería Demo",
    "codigo": "BARB-0001",
    "reservasDisponibles": true
  }
]
```

`reservasDisponibles` es `true` solo si el barbero está activo, con al menos un
servicio activo y al menos un bloque de horario activo.

### POST /cliente/barberos

Body:

```json
{ "codigo": "BARB-0001" }
```

- Idempotente: **201** si lo crea, **200** si ya estaba vinculado.
- Código inexistente, con formato inválido o barbero no activo → **404**
  `Barbero no encontrado` (el mismo 404).

**201/200**:

```json
{
  "creado": true,
  "barbero": {
    "nombre": "Barbero",
    "nombreBarberia": "Barbería Demo",
    "codigo": "BARB-0001",
    "reservasDisponibles": true
  }
}
```

### POST /cliente/barberos/:codigo/citas

Body (solo estos campos; `nombre`, `celular` o `correo` en el body → **400**):

```json
{
  "fecha": "2026-10-26",
  "horaInicio": "10:00",
  "personas": [
    { "servicioIds": [1] },
    { "servicioIds": [2, 3], "nombre": "Pedro" }
  ]
}
```

- Throttle: **5 por 10 minutos por IP**.
- El **nombre, celular y correo salen del perfil**; se copian a los campos de
  invitado de la cita (el barbero sigue viendo lo de siempre) y se rellena
  `citas.cliente_id`.
- **Vincula el barbero** (`cliente_barbero`) en la misma transacción.
- Mantiene todas las reglas actuales: disponibilidad, tolerancia de 20 min,
  `expira_en = NOW() + 2 h`, máx. 4 personas, y la regla anti-abuso **por
  celular y por cliente_id** (una `pendiente` vigente → **409**).
- Código inválido/inexistente → **404**; barbero no activo → **409** (misma
  semántica de la reserva pública).

Respuesta **201** (mismo formato de la reserva pública):

```json
{
  "token": "a23774dae1aae86e2cf0621809ba6d94",
  "seguimientoUrl": "http://localhost:3001/cita/a23774dae1aae86e2cf0621809ba6d94",
  "estado": "pendiente",
  "fecha": "2026-10-26",
  "horaInicio": "10:00",
  "horaFin": "10:30",
  "numPersonas": 1,
  "montoTotal": 20000,
  "mensaje": "Cita creada, espera a que el barbero acepte tu solicitud"
}
```

### GET /cliente/citas

Lista **todas** las citas del cliente, con estado **efectivo** calculado en SQL
con `NOW()` (una `pendiente` vencida se muestra `expirada`), más recientes
primero.

**200**:

```json
[
  {
    "id": 9,
    "estado": "pendiente",
    "fecha": "2026-10-26",
    "horaInicio": "10:00",
    "horaFin": "10:30",
    "barbero": {
      "nombre": "Barbero",
      "nombreBarberia": "Barbería Demo",
      "codigo": "BARB-0001"
    },
    "numPersonas": 1,
    "montoTotal": 20000,
    "motivos": { "motivoRechazo": null, "motivoCancelacion": null }
  }
]
```

### GET /cliente/citas/:id

Igual que el listado pero incluye `personas` con los servicios por persona
(nombre, precio y duración desde los **snapshots**). Cita inexistente o de otro
cliente → **404** `Cita no encontrada`.

Ambos endpoints (`GET /cliente/citas` y `GET /cliente/citas/:id`) incluyen
`propuestaCambioHora`:

```json
{
  "propuestaCambioHora": {
    "fecha": "2026-11-20",
    "horaInicio": "09:00",
    "horaFin": "09:30",
    "creadaEn": "2026-11-15T20:00:00.000Z",
    "expiraEn": "2026-11-15T21:00:00.000Z"
  }
}
```

Es `null` cuando no hay propuesta vigente (o cuando ya venció).

### POST /cliente/citas/:id/cambio-hora/aceptar

Sin body. Aplica la propuesta vigente:

- Si la cita venía `pendiente`, pasa a `aceptada` en la nueva hora y programa
  sus recordatorios.
- Si venía `aceptada`, conserva el estado y mueve la hora, reprogramando los
  recordatorios relativos.
- El slot original se libera y el nuevo queda ocupado.

### POST /cliente/citas/:id/cambio-hora/rechazar

Sin body:

- Cita `pendiente` → `rechazada` con motivo `cambio_hora_rechazado`.
- Cita `aceptada` → sigue `aceptada` en su hora original; solo se descarta la
  propuesta.

Si la propuesta venció o no existe → **409**. Cita de otro cliente → **404**.
Si el slot ya no está disponible al aceptar → **409** y se descarta la
propuesta.

---

## 5. Retiro de la reserva anónima

- `POST /public/barberos/:codigo/citas` ahora responde **410**
  `Inicia sesión para reservar`.
- `GET /public/citas/:token` **se mantiene tal cual**.
- `GET /public/barberos/:codigo` y `GET /public/barberos/:codigo/disponibilidad`
  siguen igual.
- Script de concurrencia actualizado:
  `CLIENTE_TOKEN=<jwt> node scripts/prueba-concurrencia.js <codigo> <fecha> <horaInicio> <servicioId>`

---

## 6. Códigos de error transversales

| Código | Caso |
|---|---|
| 400 | body inválido, campo extra, username/contraseña/celular inválidos |
| 401 | sin token/token inválido/expirado, login incorrecto, registroToken inválido, contrasenaActual incorrecta |
| 403 | rol equivocado, barbero suspendido, cliente desactivado (tras validar clave) |
| 404 | recurso inexistente o ajeno (no se revela su existencia) |
| 409 | username tomado, identidad Google ya registrada, horario no disponible, solicitud pendiente vigente |
| 410 | reserva anónima retirada |
| 429 | throttle |
| 503 | `GOOGLE_CLIENT_ID` no configurado |
