# Módulo Servicios

CRUD de los servicios que ofrece un barbero. Base URL: `http://localhost:3000`.

- Todas las rutas viven bajo `/barbero/servicios`.
- **Todos** los endpoints requieren JWT de barbero:
  `Authorization: Bearer <accessToken>`.
- El `barberoId` sale **siempre** del JWT (`@CurrentBarberoId()`). Nunca se acepta
  en el body ni en la URL.
- El token se obtiene con `POST /auth/login/barbero` (`{ username, password }`).
- Un servicio de otro barbero responde **404** (no 403) para no revelar su
  existencia.
- "Eliminar" es un **borrado lógico** (`activo = false`): la tabla
  `cita_persona_servicios` referencia `servicios` con `RESTRICT`.

## Reglas de validación

| Campo | Crear | Actualizar |
|---|---|---|
| `nombre` | obligatorio, string, 2–100 caracteres | opcional, mismas reglas |
| `descripcion` | opcional, string, máx. 500 | opcional, string, máx. 500 |
| `precio` | obligatorio, entero, mínimo 1 (pesos COP) | opcional, entero, mínimo 1 |
| `duracionMinutos` | obligatorio, entero, 5–480, divisible por 5 | opcional, mismas reglas |
| `activo` | no se envía (nace en `true`) | opcional, boolean |

`ValidationPipe` global usa `whitelist` + `forbidNonWhitelisted`: cualquier campo
extra (por ejemplo `barberoId`) devuelve **400**.

---

## POST `/barbero/servicios`

Crea un servicio para el barbero autenticado.

**Request**

```http
POST /barbero/servicios
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "nombre": "Corte de cabello",
  "descripcion": "Corte clásico",
  "precio": 20000,
  "duracionMinutos": 30
}
```

**201 Created**

```json
{
  "id": 1,
  "nombre": "Corte de cabello",
  "descripcion": "Corte clásico",
  "precio": 20000,
  "duracionMinutos": 30,
  "activo": true
}
```

**400 Bad Request** — validación (precio 0 o negativo, duración no divisible
por 5, campo extra, etc.):

```json
{
  "message": ["precio must not be less than 1"],
  "error": "Bad Request",
  "statusCode": 400
}
```

**401** sin token / token inválido. **403** si el token es de un cliente.

---

## GET `/barbero/servicios`

Lista los servicios del barbero autenticado, ordenados por `nombre` ASC.

**Query opcional:** `incluirInactivos=true` (también acepta `1`). Sin el
parámetro (o con `false`/`0`) solo devuelve `activo = true`. Cualquier otro valor
devuelve 400.

**Request**

```http
GET /barbero/servicios?incluirInactivos=true
Authorization: Bearer <token>
```

**200 OK**

```json
[
  {
    "id": 1,
    "nombre": "Corte de cabello",
    "descripcion": "Corte clásico",
    "precio": 25000,
    "duracionMinutos": 30,
    "activo": true
  }
]
```

**400** si `incluirInactivos` no es un booleano reconocido. **401 / 403** igual
que el resto.

---

## GET `/barbero/servicios/:id`

Obtiene un servicio del barbero autenticado.

**Request**

```http
GET /barbero/servicios/1
Authorization: Bearer <token>
```

**200 OK**

```json
{
  "id": 1,
  "nombre": "Corte de cabello",
  "descripcion": "Corte clásico",
  "precio": 25000,
  "duracionMinutos": 30,
  "activo": true
}
```

**400** si `:id` no es un entero (`ParseIntPipe`). **404** si no existe o
pertenece a otro barbero:

```json
{
  "message": "Servicio no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

**401 / 403** igual que el resto.

---

## PATCH `/barbero/servicios/:id`

Actualiza solo los campos enviados del servicio. También sirve para reactivar
con `{ "activo": true }`.

**Request**

```http
PATCH /barbero/servicios/1
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "precio": 25000
}
```

**200 OK** — devuelve el servicio completo actualizado:

```json
{
  "id": 1,
  "nombre": "Corte de cabello",
  "descripcion": "Corte clásico",
  "precio": 25000,
  "duracionMinutos": 30,
  "activo": true
}
```

**400** validación o body vacío con campos inválidos. **404** si no existe o es
de otro barbero. **401 / 403** igual que el resto.

---

## DELETE `/barbero/servicios/:id`

Desactiva el servicio (`activo = false`). **No borra la fila.** Devuelve 204 sin
cuerpo.

**Request**

```http
DELETE /barbero/servicios/1
Authorization: Bearer <token>
```

**204 No Content** — sin body.

**404** si no existe o es de otro barbero. **401 / 403** igual que el resto.

Tras desactivarlo:

- `GET /barbero/servicios` ya no lo muestra.
- `GET /barbero/servicios?incluirInactivos=true` lo muestra con
  `"activo": false`.
- `PATCH /barbero/servicios/1` con `{ "activo": true }` lo reactiva.

---

## Formato de errores

```json
{
  "message": "Servicio no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

En errores de validación `message` es un arreglo de strings.

| Código | Cuándo |
|---|---|
| 200 | GET / PATCH correctos |
| 201 | POST correcto |
| 204 | DELETE correcto |
| 400 | DTO inválido, campo extra, `:id` no entero o query inválida |
| 401 | Sin token o token inválido/expirado |
| 403 | Token válido pero de un cliente |
| 404 | Servicio inexistente o de otro barbero |

---

## Prueba rápida con curl

```bash
BASE=http://localhost:3000

# 1. Login del barbero
TOKEN=$(curl -s -X POST $BASE/auth/login/barbero \
  -H "Content-Type: application/json" \
  -d '{"username":"barbero1","password":"<CLAVE>"}' | jq -r .accessToken)

# 2. Crear
curl -i -X POST $BASE/barbero/servicios \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Corte de cabello","descripcion":"Corte clasico","precio":20000,"duracionMinutos":30}'

# 3. Listar
curl -i $BASE/barbero/servicios -H "Authorization: Bearer $TOKEN"

# 4. Actualizar precio
curl -i -X PATCH $BASE/barbero/servicios/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"precio":25000}'

# 5. Desactivar
curl -i -X DELETE $BASE/barbero/servicios/1 -H "Authorization: Bearer $TOKEN"

# 6. Ver inactivos
curl -i "$BASE/barbero/servicios?incluirInactivos=true" \
  -H "Authorization: Bearer $TOKEN"

# 7. Reactivar
curl -i -X PATCH $BASE/barbero/servicios/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"activo":true}'
```

> En Git Bash/Windows, si envías tildes con `curl -d` pueden corromperse por la
> codificación de la consola. Usa Thunder Client o un archivo UTF-8 con
> `--data-binary @body.json`.
