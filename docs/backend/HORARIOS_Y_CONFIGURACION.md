# Horarios de trabajo y configuración del barbero

CRUD de los bloques de horario del barbero y endpoint con su código único y su
link público de reservas. Base URL: `http://localhost:3000`.

- Horarios: rutas bajo `/barbero/horarios`.
- Configuración: ruta `GET /barbero/configuracion`.
- **Todos** los endpoints requieren JWT de barbero:
  `Authorization: Bearer <accessToken>`.
- El `barberoId` sale **siempre** del JWT (`@CurrentBarberoId()`). Nunca se acepta
  en el body ni en la URL.
- El token se obtiene con `POST /auth/login/barbero` (`{ username, password }`).
- Un horario de otro barbero responde **404** (no 403) para no revelar su
  existencia.
- Esta fase **no** toca pagos ni el porcentaje de anticipo (Fase 2).

## `diaSemana`

| Valor | Día |
|---|---|
| `0` | Domingo |
| `1` | Lunes |
| `2` | Martes |
| `3` | Miércoles |
| `4` | Jueves |
| `5` | Viernes |
| `6` | Sábado |

## Reglas de validación

| Campo | Crear | Actualizar |
|---|---|---|
| `diaSemana` | obligatorio, entero, 0–6 | opcional, mismas reglas |
| `horaInicio` | obligatorio, `HH:mm`, minutos 00/15/30/45 | opcional, mismas reglas |
| `horaFin` | obligatorio, `HH:mm`, minutos 00/15/30/45, mayor que `horaInicio` | opcional, mismas reglas |
| `activo` | opcional, boolean (por defecto `true`) | opcional, boolean |

`ValidationPipe` global usa `whitelist` + `forbidNonWhitelisted`: cualquier campo
extra (por ejemplo `barberoId`) devuelve **400**.

## Reglas de negocio

- Se permiten **varios bloques por día** (ej. `07:00–12:00` y `14:00–18:00`).
- Un bloque **activo** no puede solaparse con otro bloque **activo** del mismo
  día. Si se cruza → **409**.
- Que un bloque termine justo cuando empieza otro **no es solape**: `07:00–12:00`
  y `12:00–14:00` pueden convivir.
- Los bloques con `activo = false` **no** bloquean la creación ni la reactivación
  de otros bloques.
- Al reactivar (`PATCH` con `{ "activo": true }`) se vuelve a validar el solape
  contra los demás bloques activos del día, excluyendo el propio.
- `DELETE` es **borrado físico**: ninguna tabla referencia `horarios_trabajo`.

---

## POST `/barbero/horarios`

Crea un bloque de horario para el barbero autenticado.

**Request**

```http
POST /barbero/horarios
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "diaSemana": 1,
  "horaInicio": "07:00",
  "horaFin": "12:00"
}
```

Body alternativo con `activo` explícito:

```json
{
  "diaSemana": 1,
  "horaInicio": "14:00",
  "horaFin": "18:00",
  "activo": true
}
```

**201 Created**

```json
{
  "id": 1,
  "diaSemana": 1,
  "horaInicio": "07:00",
  "horaFin": "12:00",
  "activo": true
}
```

**400 Bad Request** — validación (`horaFin` menor o igual a `horaInicio`,
minutos que no son múltiplo de 15, `diaSemana` fuera de 0–6, campo extra, etc.):

```json
{
  "message": ["horaFin debe ser múltiplo de 15 minutos (00, 15, 30 o 45)"],
  "error": "Bad Request",
  "statusCode": 400
}
```

```json
{
  "message": "La hora de fin debe ser mayor que la hora de inicio",
  "error": "Bad Request",
  "statusCode": 400
}
```

**401** sin token / token inválido. **403** si el token es de un cliente.

**409 Conflict** — el bloque activo se cruza con otro bloque activo del día:

```json
{
  "message": "El horario se cruza con otro bloque de ese día",
  "error": "Conflict",
  "statusCode": 409
}
```

---

## GET `/barbero/horarios`

Lista todos los bloques del barbero autenticado (activos e inactivos), ordenados
por `diaSemana` ASC y `horaInicio` ASC.

**Request**

```http
GET /barbero/horarios
Authorization: Bearer <token>
```

**200 OK**

```json
[
  {
    "id": 1,
    "diaSemana": 1,
    "horaInicio": "07:00",
    "horaFin": "12:00",
    "activo": true
  },
  {
    "id": 2,
    "diaSemana": 1,
    "horaInicio": "14:00",
    "horaFin": "18:00",
    "activo": true
  },
  {
    "id": 3,
    "diaSemana": 3,
    "horaInicio": "09:00",
    "horaFin": "13:00",
    "activo": false
  }
]
```

**401 / 403** igual que el resto.

---

## PATCH `/barbero/horarios/:id`

Actualiza solo los campos enviados. También sirve para desactivar
(`{ "activo": false }`) o reactivar (`{ "activo": true }`).

**Request**

```http
PATCH /barbero/horarios/1
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "activo": false
}
```

**200 OK** — devuelve el bloque completo actualizado:

```json
{
  "id": 1,
  "diaSemana": 1,
  "horaInicio": "07:00",
  "horaFin": "12:00",
  "activo": false
}
```

**400** validación o `:id` no entero (`ParseIntPipe`). **404** si no existe o es
de otro barbero:

```json
{
  "message": "Horario no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

**409 Conflict** — al reactivar o cambiar el horario, el resultado quedaría
activo y se cruza con otro bloque activo del día:

```json
{
  "message": "El horario se cruza con otro bloque de ese día",
  "error": "Conflict",
  "statusCode": 409
}
```

**401 / 403** igual que el resto.

---

## DELETE `/barbero/horarios/:id`

Elimina el bloque **físicamente** (no queda fila). Devuelve 204 sin cuerpo.

**Request**

```http
DELETE /barbero/horarios/1
Authorization: Bearer <token>
```

**204 No Content** — sin body.

**404** si no existe o es de otro barbero. **401 / 403** igual que el resto.

---

## GET `/barbero/configuracion`

Devuelve el código único del barbero autenticado y su link público de reservas.
El link se arma con `APP_PUBLIC_URL` del `.env`:
`{APP_PUBLIC_URL}/b/{codigoUnico}`.

**Request**

```http
GET /barbero/configuracion
Authorization: Bearer <token>
```

**200 OK**

```json
{
  "codigoUnico": "BARB-0001",
  "linkReservas": "http://localhost:3001/b/BARB-0001"
}
```

**401** sin token / token inválido. **403** si el token es de un cliente.
**404** si el barbero del JWT ya no existe:

```json
{
  "message": "Barbero no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## Formato de errores

```json
{
  "message": "Horario no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

Los errores de validación devuelven `message` como arreglo de strings.

## Tablas implicadas

- `horarios_trabajo`: `id`, `barbero_id`, `dia_semana`, `hora_inicio` (TIME),
  `hora_fin` (TIME), `activo`.
- `barberos`: solo se lee `codigo_unico` y `id` para `/barbero/configuracion`.

No hay cambios de esquema en esta fase.
