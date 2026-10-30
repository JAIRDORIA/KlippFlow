# API pública: crear cita y seguimiento

Endpoints **sin JWT** para que un cliente invitado cree una solicitud de cita y
siga su estado. Fase 1: **sin pago** (`estado_pago = 'no_aplica'`).

Base URL: `http://localhost:3000`.

- `POST /public/barberos/:codigo/citas`
- `GET  /public/citas/:token`

Reglas comunes:

- El barbero se resuelve por su código; el cliente nunca envía `barberoId`.
- Código válido: `^[A-Za-z0-9-]{4,20}$`. Si el formato es inválido → **404** con
  el mismo mensaje que un código inexistente.
- Nunca se confía en precios ni duraciones enviados por el cliente: se toman de
  `servicios` en la base de datos.
- Límite de creación: **5 POST por 10 minutos por IP**. Seguimiento: **30 GET por
  minuto por IP**.

---

## POST `/public/barberos/:codigo/citas`

Crea una cita en estado `pendiente` con `expira_en = NOW() + 2 horas`. La primera
persona del arreglo `personas` es el titular.

**Request**

```http
POST /public/barberos/BARB-0001/citas
Content-Type: application/json
```

```json
{
  "nombre": "Juan Pérez",
  "celular": "+57 300 123 4567",
  "correo": "juan@example.com",
  "fecha": "2026-10-26",
  "horaInicio": "10:00",
  "personas": [
    { "servicioIds": [1] },
    { "servicioIds": [2, 3], "nombre": "Pedro" }
  ]
}
```

- `nombre`: 2–100 caracteres (titular).
- `celular`: se normaliza (ver abajo).
- `correo`: opcional, email válido.
- `fecha`: `YYYY-MM-DD`, entre hoy y hoy + 7 días (hora de Bogotá).
- `horaInicio`: `HH:mm` en la cuadrícula de 15 minutos.
- `personas`: 1 a 4. Cada persona lleva 1 a 10 `servicioIds` únicos. No existe
  `vaSolo`: se deriva de `personas.length`.
- La duración total (suma de todas las personas) debe estar entre 5 y 600 minutos.

**201 Created**

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

`seguimientoUrl` se arma con `APP_PUBLIC_URL`. `montoTotal` es informativo: en la
Fase 1 se cobra completo en el local.

### Regla del celular

Se eliminan todos los caracteres que no sean dígitos. Si quedan 12 dígitos y
empieza por `57`, se quita el `57`. El resultado debe cumplir `^3\d{9}$`.

- `"+57 300 123 4567"` → se guarda `3001234567`.
- `"123"` → **400** `Celular inválido`.

### Regla anti-abuso

Un mismo celular no puede tener otra cita en `pendiente` vigente (`expira_en >
NOW()`) **con ningún barbero**. Si la hay → **409**.

La verificación ocurre dentro de la transacción que bloquea al barbero, pero la
regla del celular **no se serializa entre barberos distintos** (ver limitación de
concurrencia).

### Tolerancia de fin de bloque

Una cita puede terminar hasta **20 minutos después** del fin de un bloque, siempre
que **empiece dentro** del bloque. La tolerancia nunca invade el siguiente bloque:
el límite es `min(fin del bloque + 20, inicio del bloque siguiente)`.

| Bloque | Servicio | Inicio | Fin | ¿Se ofrece? |
|---|---|---|---|---|
| 07:00–12:00 | 50 min | 11:15 | 12:05 | sí (invade 5) |
| 07:00–12:00 | 50 min | 11:30 | 12:20 | sí (invade 20) |
| 07:00–12:00 | 50 min | 11:45 | 12:35 | no (supera 12:20) |
| 07:00–12:00 + 12:00–18:00 | 30 min | 11:30 | 12:00 | sí, pero no hay tolerancia (el siguiente empieza justo) |

Los minutos que invaden se guardan en `citas.minutos_fuera_horario` para avisarle
al barbero en el panel.

### Errores

| Código | Caso |
|---|---|
| 400 | body inválido, campo extra (`whitelist`), fecha inválida/fuera de rango, hora fuera de cuadrícula, servicio inexistente/inactivo/de otro barbero, celular inválido, duración total inválida, más de 4 personas |
| 404 | código inexistente o con formato inválido |
| 409 | barbero no activo, horario ya no disponible, celular con solicitud pendiente |
| 429 | más de 5 POST en 10 minutos desde la misma IP |

Ejemplos:

```json
{ "message": "Servicio no válido", "error": "Bad Request", "statusCode": 400 }
```

```json
{ "message": "Ese horario ya no está disponible", "error": "Conflict", "statusCode": 409 }
```

```json
{
  "message": "Ya tienes una solicitud pendiente de respuesta. Espera la respuesta del barbero para hacer otra",
  "error": "Conflict",
  "statusCode": 409
}
```

---

## GET `/public/citas/:token`

Estado de la cita por su token de seguimiento (`^[a-f0-9]{32}$`). Responde con
`Cache-Control: no-store`.

**Request**

```http
GET /public/citas/a23774dae1aae86e2cf0621809ba6d94
```

**200 OK**

```json
{
  "estado": "pendiente",
  "mensaje": "Tu solicitud fue enviada. Espera a que el barbero la acepte.",
  "fecha": "2026-10-26",
  "horaInicio": "10:00",
  "horaFin": "10:30",
  "barbero": {
    "nombres": "Barbero",
    "nombreBarberia": "Barbería Demo"
  },
  "numPersonas": 1,
  "montoTotal": 20000
}
```

Si la cita fue rechazada se agrega `motivoRechazo` (`horario_ocupado` |
`no_disponible`); si fue cancelada se agrega `motivoCancelacion`.

Si `estado = 'pendiente'` y `expira_en <= NOW()`, la respuesta devuelve
`estado: "expirada"` aunque el job todavía no haya actualizado la fila.

### Mensajes por estado

| Estado | Mensaje |
|---|---|
| `pendiente` | Tu solicitud fue enviada. Espera a que el barbero la acepte. |
| `aceptada` | ¡Cita confirmada! Te esperamos. |
| `rechazada` | El barbero no pudo atender tu solicitud. + motivo |
| `expirada` | El barbero no respondió a tiempo. Puedes solicitar otro horario. |
| `cancelada` | El barbero canceló esta cita. |
| `atendida` | Cita atendida. ¡Gracias por visitarnos! |
| `no_asistio` | La cita fue marcada como no asistida. |

**Privacidad:** la respuesta NUNCA incluye celular, correo ni nombre del cliente.

**404** si el token no existe o su formato es inválido:

```json
{ "message": "Cita no encontrada", "error": "Not Found", "statusCode": 404 }
```

**429** si se superan 30 GET por minuto desde la misma IP.

---

## Concurrencia

`crearReservaExclusiva` abre una transacción y hace
`SELECT id FROM barberos WHERE id = ? FOR UPDATE`, lo que serializa las reservas
del **mismo barbero**. Dos POST simultáneos al mismo horario producen exactamente
un **201** y un **409**.

**Limitación conocida:** la regla del celular se evalúa dentro de esa transacción,
pero **no está serializada entre barberos distintos**: dos solicitudes simultáneas
con el mismo celular a barberos diferentes podrían pasar. Es una carrera rara y de
bajo impacto; si se quiere cerrar, habría que bloquear por celular (tabla o
`GET_LOCK`).

Para probarla:

```bash
node scripts/prueba-concurrencia.js BARB-0001 2026-10-26 14:00 1
```

---

## Tablas implicadas

- `citas`, `cita_personas`, `cita_persona_servicios` (se borran en cascada al
  borrar la cita).
- `barberos`, `servicios`, `horarios_trabajo` (solo lectura).

Sin cambios de esquema en este paso.
