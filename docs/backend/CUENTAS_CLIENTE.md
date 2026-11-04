# Cuentas de cliente: Google, login unificado y citas con sesión

El cliente crea su cuenta con **Google** (verifica correo y nombre), completa
`username + contraseña + celular`, y a partir de ahí usa un **login unificado**
(barbero o cliente: el rol sale de quién es el usuario). Con su sesión guarda
barberos, reserva y consulta sus citas.

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
- Barbero suspendido/vencido o cliente desactivado → **403** **después** de
  validar la contraseña.

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
- Crea en **una sola transacción** el cliente + su identidad y devuelve sesión
  `metodo: 'google'`.

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
| 409 | identidad Google ya registrada (índice único) |
| 429 | más de 5 intentos en 10 minutos |

Para probar sin Google real:

```bash
node scripts/generar-registro-token.js
```

Imprime un `registroToken` firmado con el `JWT_SECRET` del `.env` (dura 15 min;
se niega a correr con `NODE_ENV=production`).

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
