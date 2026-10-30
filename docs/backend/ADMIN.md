# API de administración (Jair / dueño de la plataforma)

Solo backend. Permite al administrador iniciar sesión y gestionar las cuentas
de los barberos: crear, listar, ver, cambiar el estado, rotar el código único y
restablecer la contraseña.

- Los **admins** viven en la tabla `admins` y se crean **a mano con SQL**. No
  existe endpoint para crear admins ni para registrarse.
- El admin opera sobre **todos** los barberos por diseño: la regla de
  aislamiento por `barberoId` del JWT **no aplica** a `/admin/...`.
- Nunca se devuelve `password_hash` en ninguna respuesta.

---

## Login del admin: `POST /auth/login/admin`

Body:

```json
{
  "username": "admin_jair",
  "password": "TuClaveSegura"
}
```

Respuesta **200**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "admin": {
    "id": 1,
    "username": "admin_jair",
    "nombre": "Jair"
  }
}
```

Reglas:

- **401** con el mensaje genérico `Usuario o contraseña incorrectos` si el
  usuario no existe o la contraseña es incorrecta (mismo mensaje y mismo
  trabajo de bcrypt: si el admin no existe se compara contra un hash dummy).
- **403** si las credenciales son correctas pero `activo = 0`.
- **429** con más de **5 intentos por minuto por IP**.
- Expiración del token: `ADMIN_JWT_EXPIRES_IN` (opcional, por defecto `2h`). El
  secreto es el mismo `JWT_SECRET`.

Payload del JWT:

```json
{ "sub": 1, "tipo": "admin", "username": "admin_jair" }
```

En **cada petición** con rol admin, `JwtStrategy` consulta el admin por PK y
exige que siga existiendo y con `activo = 1`; si no, responde **401**.

---

## Crear un admin a mano (SQL)

```bash
node scripts/generar-hash.js 'TuClaveSegura'   # imprime el hash bcrypt
```

```sql
INSERT INTO admins (username, password_hash, nombre, activo)
VALUES ('admin_jair', '<hash-bcrypt>', 'Jair', 1);
```

`admins`: `id`, `username` (único, varchar(50)), `password_hash` (varchar(255)),
`nombre` (varchar(100)), `activo` (tinyint(1), default 1), `creado_en`
(timestamp, default CURRENT_TIMESTAMP).

---

## Aislamiento de roles

| Petición | Resultado |
|---|---|
| Token de barbero en `/admin/...` | 403 |
| Token de cliente en `/admin/...` | 403 |
| Token de admin en `/barbero/...` | 403 |
| Sin token | 401 |
| Token de admin inactivo (desactivado después de emitirlo) | 401 |

Todos los endpoints de administración usan
`@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('admin')`.

---

## CRÍTICO: suspensión efectiva del barbero

`JwtStrategy` verifica en **cada petición** de un token `tipo = 'barbero'` que
el barbero siga existiendo y con `estado_cuenta = 'activo'` (una consulta por
PK). Si no, responde **403 `Cuenta no activa`**. Por eso un token emitido antes
de suspender la cuenta deja de funcionar de inmediato.

Efectos de suspender (`PATCH /admin/barberos/:id/estado` con `suspendido` o
`vencido`):

- El barbero **no puede iniciar sesión** (403 después de validar la contraseña).
- Sus tokens vigentes dejan de funcionar (403).
- `GET /public/barberos/:codigo` responde con `reservasDisponibles: false`.
- Las **citas ya creadas no se modifican**.
- Al volver a `activo`, todo funciona de nuevo.

---

## Endpoints

Todos requieren `Authorization: Bearer <token-de-admin>`.

### POST /admin/barberos → 201

Crea un barbero. El servidor genera `codigoUnico` (8 caracteres aleatorios, sin
ambiguos) y el `linkReservas`.

Request:

```json
{
  "username": "ana.paz",
  "password": "ClaveSegura1",
  "nombres": "Ana",
  "apellidos": "Paz",
  "nombreBarberia": "Ana Barber",
  "correo": "ana@example.com"
}
```

| Campo | Reglas |
|---|---|
| `username` | 3–50, minúsculas, números, `.`, `-`, `_` |
| `password` | 8–72 (límite de bcrypt) |
| `nombres` | obligatorio, 1–100 |
| `apellidos` | obligatorio, 1–100 |
| `nombreBarberia` | opcional, máximo 150 |
| `correo` | obligatorio (la columna es NOT NULL), email, máximo 150 |

No se aceptan `id`, `codigoUnico`, `estadoCuenta` ni otros campos: el
`ValidationPipe` global responde **400**.

Response 201:

```json
{
  "id": 15,
  "codigoUnico": "K7M2P9QX",
  "nombres": "Ana",
  "apellidos": "Paz",
  "nombreBarberia": "Ana Barber",
  "username": "ana.paz",
  "correo": "ana@example.com",
  "estadoCuenta": "activo",
  "linkReservas": "https://app.barberapp.com/b/K7M2P9QX"
}
```

- `estado_cuenta` se crea en `activo`.
- `porcentaje_anticipo` usa el valor por defecto de la tabla (`30.00`).
- El código se genera con `crypto.randomInt` (sin sesgo de módulo). Si el
  índice único acusa colisión, se reintenta hasta **5 veces**.
- `username` repetido → **409**. `correo` repetido → **409**.

### GET /admin/barberos → 200

Query params opcionales:

| Param | Reglas |
|---|---|
| `estado` | `activo`, `suspendido` o `vencido` |
| `busqueda` | texto; busca en `username` y `nombre_barberia` (LIKE parametrizado) |
| `pagina` | entero ≥ 1 (default 1) |
| `limite` | entero ≥ 1 (default 20, máximo 50) |

- `limite=100` → HTTP **200**, pero la respuesta devuelve `limite: 50`
  (se ajusta al máximo, no falla).
- Orden: creación descendente.

Response 200:

```json
{
  "total": 2,
  "pagina": 1,
  "limite": 20,
  "barberos": [
    {
      "id": 15,
      "codigoUnico": "K7M2P9QX",
      "nombres": "Ana",
      "apellidos": "Paz",
      "nombreBarberia": "Ana Barber",
      "username": "ana.paz",
      "correo": "ana@example.com",
      "estadoCuenta": "activo",
      "linkReservas": "https://app.barberapp.com/b/K7M2P9QX"
    }
  ]
}
```

### GET /admin/barberos/:id → 200

Devuelve el mismo formato que la creación (incluye `codigoUnico`,
`linkReservas` y `estadoCuenta`).

- `:id` no numérico, negativo o cero → **400**.
- `:id` inexistente → **404**.

### PATCH /admin/barberos/:id/estado → 200

Request:

```json
{ "estado": "suspendido" }
```

- Valores permitidos: `activo`, `suspendido`, `vencido`. Otro → **400**.
- Update atómico. Si ya tenía ese estado responde **200 sin cambios**.
- `:id` inexistente → **404**.

### POST /admin/barberos/:id/rotar-codigo → 200

Genera un `codigoUnico` nuevo con el mismo generador (reintenta hasta 5 veces
si colisiona). Update atómico en una transacción corta, sin llamadas externas.

Response 200:

```json
{
  "codigoUnico": "B4N8R2TW",
  "linkReservas": "https://app.barberapp.com/b/B4N8R2TW"
}
```

Efectos:

- El código anterior deja de existir: `GET /public/barberos/:codigoAnterior` y
  su disponibilidad responden **404**.
- `GET /barbero/configuracion` del barbero devuelve el código nuevo.
- Los `token_seguimiento` de las citas existentes **no cambian**: los links de
  seguimiento siguen funcionando.
- Solo el **admin** puede rotar el código; el barbero no tiene endpoint para
  cambiarlo.
- `:id` inexistente → **404**.

### POST /admin/barberos/:id/restablecer-password → 200

Request:

```json
{ "password": "NuevaClave123" }
```

- 8–72 caracteres; fuera de rango → **400**.
- Guarda el hash con bcrypt (puerto `HasherPort`).
- **No invalida los tokens ya emitidos**: siguen funcionando hasta expirar
  (`JWT_EXPIRES_IN`, por defecto 7d). No hay lista de revocación.
- `:id` inexistente → **404**.

Response 200:

```json
{ "ok": true }
```

---

## Errores

| Código | Caso |
|---|---|
| 400 | Body/query inválido, `:id` no entero positivo, campos desconocidos |
| 401 | Sin token, token inválido/expirado, admin inactivo, login incorrecto |
| 403 | Rol equivocado, barbero con cuenta no activa |
| 404 | Barbero inexistente |
| 409 | `username` o `correo` duplicado; no se pudo generar código único |
| 429 | Más de 5 intentos de login admin por minuto |

---

## Ejemplos con curl

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login/admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_jair","password":"TuClaveSegura"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken")

curl -X POST http://localhost:3000/admin/barberos \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"username":"ana.paz","password":"ClaveSegura1","nombres":"Ana","apellidos":"Paz","correo":"ana@example.com"}'

curl "http://localhost:3000/admin/barberos?estado=activo&busqueda=ana&pagina=1&limite=20" \
  -H "Authorization: Bearer $TOKEN"

curl -X PATCH http://localhost:3000/admin/barberos/15/estado \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"estado":"suspendido"}'

curl -X POST http://localhost:3000/admin/barberos/15/rotar-codigo \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:3000/admin/barberos/15/restablecer-password \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"password":"NuevaClave123"}'
```
