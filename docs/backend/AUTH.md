# Autenticación — BarberApp Backend

Base URL local: `http://localhost:3000`

Todos los endpoints reciben y devuelven JSON (`Content-Type: application/json`).
El `ValidationPipe` global usa `whitelist`, `forbidNonWhitelisted` y `transform`.

---

## POST /auth/login/cliente (heredado)

> **Heredado.** Se conserva por compatibilidad, pero el login nuevo es
> `POST /auth/login` (unificado). Este endpoint solo busca en `clientes` y
> devuelve `{ accessToken, cliente }`.

Inicia sesión como cliente.

### Request

```json
{
  "username": "admin",
  "password": "TuClave123"
}
```

| Campo | Tipo | Reglas |
|---|---|---|
| `username` | string | obligatorio |
| `password` | string | obligatorio, mínimo 6 caracteres |

### Respuesta 200

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "cliente": {
    "id": 1,
    "nombre": "Admin",
    "username": "admin",
    "correo": "admin@example.com",
    "celular": null
  }
}
```

### Errores

- **401** `{ "message": "Usuario o contraseña incorrectos", "error": "Unauthorized", "statusCode": 401 }`
  si el usuario no existe o la contraseña es incorrecta (mismo mensaje en ambos casos).
- **400** si el body no valida (campo faltante, tipo incorrecto, contraseña menor a 6 caracteres o campos no permitidos).

---

## POST /auth/login/barbero

Inicia sesión como barbero.

### Request

```json
{
  "username": "barbero1",
  "password": "Barbero2026"
}
```

| Campo | Tipo | Reglas |
|---|---|---|
| `username` | string | obligatorio |
| `password` | string | obligatorio, mínimo 6 caracteres |

### Respuesta 200

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
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

`estadoCuenta` puede ser `activo`, `suspendido` o `vencido`.

### Errores

- **401** `{ "message": "Usuario o contraseña incorrectos", "error": "Unauthorized", "statusCode": 401 }`
  si el usuario no existe o la contraseña es incorrecta. Es el mismo mensaje en
  ambos casos para evitar la enumeración de usuarios.
- **403** `{ "message": "Tu cuenta está suspendida o vencida. Comunícate con el administrador de la plataforma.", "error": "Forbidden", "statusCode": 403 }`
  si las credenciales son correctas pero `estado_cuenta` es `suspendido` o
  `vencido`.
- **400** si el body no valida (campo faltante, tipo incorrecto, contraseña menor
  a 6 caracteres o campos no permitidos).

> El estado de la cuenta se valida **después** de comprobar la contraseña, para
> no revelar el estado de una cuenta a quien no conoce su clave.

### Orden de validación del caso de uso

1. Buscar el barbero por `username`.
2. Comparar la contraseña con `password_hash` (bcrypt).
3. Verificar que `estadoCuenta === 'activo'`.
4. Firmar el JWT.
5. Devolver el token y los datos del barbero.

---

## POST /auth/login/admin

Inicia sesión como administrador de la plataforma (Jair). Los admins se crean a
mano con SQL en la tabla `admins` (ver `docs/ADMIN.md`); no hay registro.

### Request

```json
{
  "username": "admin_jair",
  "password": "TuClaveSegura"
}
```

### Respuesta 200

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

### Errores

- **401** `{ "message": "Usuario o contraseña incorrectos", ... }` si el admin
  no existe o la contraseña es incorrecta. El mismo mensaje en ambos casos y se
  ejecuta bcrypt igualmente (hash dummy si el admin no existe) para no dejar un
  canal por tiempos.
- **403** si las credenciales son correctas pero `activo = 0`. Se valida
  **después** de comprobar la contraseña.
- **429** con más de **5 intentos por minuto por IP**.

El token de admin usa `ADMIN_JWT_EXPIRES_IN` (opcional, por defecto `2h`) y el
mismo `JWT_SECRET`.

---

## POST /auth/login (unificado — recomendado para barberos y clientes)

Inicia sesión con un **mismo endpoint** para barberos y clientes. El rol sale
de quién es el usuario: primero busca en `barberos` y luego en `clientes`, por
username normalizado (minúsculas).

### Request

```json
{
  "usuario": "barbero1",
  "contrasena": "Barbero2026"
}
```

| Campo | Tipo | Reglas |
|---|---|---|
| `usuario` | string | obligatorio, no vacío |
| `contrasena` | string | obligatorio, no vacío |

### Respuesta 200 — barbero

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

### Respuesta 200 — cliente

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

### Errores

- **401** `Usuario o contraseña incorrectos` si el usuario no existe o la
  contraseña es incorrecta (mismo mensaje; bcrypt se ejecuta igual con hash
  dummy si el usuario no existe).
- **403** si las credenciales son correctas pero el barbero está
  suspendido/vencido o el cliente desactivado. Se valida **después** de la
  contraseña.
- **429** con más de 10 intentos por minuto por IP.

---

## POST /auth/cliente/google

Verifica un `idToken` de Google y, si la identidad ya existe, inicia sesión.
Si la identidad no existe, **no crea nada**: devuelve un `registroToken` para
completar la cuenta.

### Request

```json
{ "idToken": "eyJhbGciOiJSUzI1NiIs..." }
```

### Respuesta 200 — identidad existente

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

### Respuesta 200 — identidad nueva

```json
{
  "requiereCompletar": true,
  "registroToken": "eyJhbGciOiJIUzI1NiIs...",
  "perfil": { "nombre": "Cliente Google", "correo": "google@example.com" }
}
```

### Errores

- **401** `Token de Google inválido` o `Correo de Google no verificado`
  (`email_verified !== true`).
- **503** `Inicio con Google no configurado` si falta `GOOGLE_CLIENT_ID`.
- **429** con más de 10 intentos por minuto por IP.

La llave de identidad es el `sub` de Google, **nunca** el correo.

---

## POST /auth/cliente/completar-cuenta

Completa la cuenta de un cliente que inició con Google. Crea en **una sola
transacción** el cliente y su identidad, y devuelve sesión `metodo: 'google'`.

### Request

```json
{
  "registroToken": "eyJhbGciOiJIUzI1NiIs...",
  "username": "test_google",
  "contrasena": "ClaveSegura123",
  "celular": "+57 300 111 2233",
  "nombre": "Cliente Google"
}
```

`nombre` es opcional (si no llega se usa el del token). Throttle: **5 por 10
minutos por IP**.

### Respuesta 201

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

### Errores

- **400** username reservado/formato inválido, contraseña inválida (8–72 y
  distinta del username) o celular inválido.
- **401** `registroToken` inválido o vencido.
- **409** `Ese usuario ya está en uso` (barbero, admin o cliente) o
  `Ya existe una cuenta para este Google`.
- **429** con más de 5 intentos por IP en 10 minutos.

Para probar sin Google real: `node scripts/generar-registro-token.js`.

---

## JWT

Payload firmado:

```json
{
  "sub": 1,
  "tipo": "cliente",
  "username": "admin",
  "metodo": "password"
}
```

`tipo` es `'cliente'`, `'barbero'` o `'admin'`. `metodo` es `'password'` o
`'google'` (barbero y admin siempre `'password'`). Los endpoints protegidos
reciben el token con `Authorization: Bearer <accessToken>` y usan
`@UseGuards(JwtAuthGuard)`. Para restringir por rol se usa
`@UseGuards(JwtAuthGuard, RolesGuard)` junto con `@Roles('barbero')`,
`@Roles('cliente')` o `@Roles('admin')`.

`JwtStrategy` valida la firma y la expiración y además, en **cada petición**:

- Si `tipo = 'barbero'`: consulta el barbero por PK y exige
  `estado_cuenta = 'activo'`; si no, **403 `Cuenta no activa`**.
- Si `tipo = 'cliente'`: consulta el cliente por PK y exige que exista y esté
  `activo`; si no, **401**.
- Si `tipo = 'admin'`: consulta el admin por PK y exige `activo = 1`; si no,
  **401**.
- Cualquier otro `tipo` (por ejemplo `registro_cliente`) se rechaza con **401**:
  un token de registro jamás sirve como token de sesión.

Así una suspensión o desactivación surte efecto de inmediato aunque el token
siga vigente.

---

## Ejemplos con curl

### Login de barbero correcto

```bash
curl -i -X POST http://localhost:3000/auth/login/barbero \
  -H "Content-Type: application/json" \
  -d '{"username":"barbero1","password":"Barbero2026"}'
```

### Contraseña incorrecta

```bash
curl -i -X POST http://localhost:3000/auth/login/barbero \
  -H "Content-Type: application/json" \
  -d '{"username":"barbero1","password":"ClaveIncorrecta"}'
```

### Usuario inexistente

```bash
curl -i -X POST http://localhost:3000/auth/login/barbero \
  -H "Content-Type: application/json" \
  -d '{"username":"noexiste","password":"Barbero2026"}'
```

### Body inválido

```bash
curl -i -X POST http://localhost:3000/auth/login/barbero \
  -H "Content-Type: application/json" \
  -d '{"username":"barbero1","password":"123"}'
```

### Cuenta suspendida (requiere UPDATE manual previo)

```bash
curl -i -X POST http://localhost:3000/auth/login/barbero \
  -H "Content-Type: application/json" \
  -d '{"username":"barbero1","password":"Barbero2026"}'
```

---

## Autorización por rol

### Piezas disponibles

| Pieza | Ubicación | Función |
|---|---|---|
| `JwtAuthGuard` | `src/modules/auth/infrastructure/guards/jwt-auth.guard.ts` | Valida el `Authorization: Bearer <token>` y deja el payload en `request.user`. |
| `RolesGuard` | `src/common/guards/roles.guard.ts` | Lee los roles exigidos con `Reflector` y compara `request.user.tipo`. Sin roles requeridos deja pasar; sin usuario lanza `401`; con rol incorrecto lanza `403`. |
| `@Roles(...)` | `src/common/decorators/roles.decorator.ts` | Declara los roles permitidos: `@Roles('barbero')`, `@Roles('cliente')`, `@Roles('admin')`. |
| `@CurrentUser()` | `src/common/decorators/current-user.decorator.ts` | Devuelve el `JwtPayload` completo. Con una clave, devuelve solo esa propiedad: `@CurrentUser('sub')`. |
| `@CurrentBarberoId()` | `src/common/decorators/current-barbero-id.decorator.ts` | Devuelve `request.user.sub` solo si `tipo === 'barbero'`; si no, `403`. |
| `@CurrentClienteId()` | `src/common/decorators/current-cliente-id.decorator.ts` | Devuelve `request.user.sub` solo si `tipo === 'cliente'`; si no, `403`. |
| `@CurrentAdminId()` | `src/common/decorators/current-admin-id.decorator.ts` | Devuelve `request.user.sub` solo si `tipo === 'admin'`; si no, `403`. |

> **Regla multi-tenant:** el id del usuario se obtiene **siempre** del JWT con
> `@CurrentBarberoId()` / `@CurrentClienteId()` (o `@CurrentUser('sub')`). Nunca
> del body ni de parámetros de la URL.

> **Orden de guards:** `JwtAuthGuard` siempre va primero, porque `RolesGuard` y
> los decoradores de id leen `request.user`.
> `@UseGuards(JwtAuthGuard, RolesGuard)`.

### Ejemplo de uso en un controller

```ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentBarberoId } from '../../../common/decorators/current-barbero-id.decorator';

@Controller('barberos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('barbero')
export class EjemploController {
  @Get('mi-perfil')
  miPerfil(@CurrentBarberoId() barberoId: number) {
    // El id viene del JWT, no del body ni de la URL.
    return this.casoDeUso.ejecutar(barberoId);
  }
}
```

### Endpoints temporales de validación

Están en `src/modules/auth/infrastructure/http/auth-test.controller.ts`, marcados
con `// TEMPORAL - eliminar tras validar guards`:

| Endpoint | Guards | Respuesta correcta |
|---|---|---|
| `GET /auth-test/yo` | `JwtAuthGuard` | `200` con el payload del JWT |
| `GET /auth-test/solo-barbero` | `JwtAuthGuard, RolesGuard` + `@Roles('barbero')` | `200 { mensaje: 'ok barbero', barberoId }` |
| `GET /auth-test/solo-cliente` | `JwtAuthGuard, RolesGuard` + `@Roles('cliente')` | `200 { mensaje: 'ok cliente', clienteId }` |

Casos de error: sin token → `401`; token válido con rol equivocado → `403`
`{ "message": "No tienes permisos para esta acción", "statusCode": 403 }`.

---

## Utilidad para generar hashes

```bash
node scripts/generar-hash.js MiClave
```

Imprime únicamente el hash bcrypt (10 rondas), listo para pegar en
`password_hash`.
