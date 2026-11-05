# Web Push al cliente

Avisos al **cliente dueño de la cita** (`citas.cliente_id`). Si la cita no tiene
`cliente_id`, no se envía nada. El push al barbero no cambia.

---

## Endpoints (JWT de cliente)

Todos con `JwtAuthGuard` + `RolesGuard` + `@Roles('cliente')`. El `clienteId`
sale siempre del JWT (`@CurrentClienteId()`); enviarlo en el body da **400**.

| Método | Ruta | Respuesta |
|---|---|---|
| `GET` | `/cliente/push/llave-publica` | `200 { "llavePublica": "<VAPID_PUBLIC_KEY>" }` |
| `POST` | `/cliente/push/suscripcion` | `201 { "creada": true }` (nueva) / `200 { "creada": false }` (repetida) |
| `DELETE` | `/cliente/push/suscripcion` | `204` al borrar; `404` si no existe o es de otro |

`POST` y `DELETE` tienen throttle de **10 peticiones/min**.

Body de `POST` (mismo contrato que el del barbero):

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BN...",
    "auth": "abc..."
  }
}
```

Validaciones: `endpoint` https y ≤ 500 caracteres; `p256dh` y `auth`
base64url y ≤ 255; `forbidNonWhitelisted` (campos extra → 400).

Body de `DELETE`: `{ "endpoint": "https://fcm.googleapis.com/fcm/send/..." }`.

---

## Payload

Misma forma que el push del barbero (`titulo`, `cuerpo`, `url`) más `tag`,
`tipo` y `citaId`:

```json
{
  "titulo": "Tu cita fue aceptada",
  "cuerpo": "Barbería El Rey · hoy 3:30 p. m.",
  "url": "/mi/citas/42",
  "tag": "cita-42",
  "tipo": "cita_aceptada",
  "citaId": 42
}
```

- `tipo`: `cita_aceptada` | `cita_rechazada` | `cita_cancelada` | `cita_expirada`.
- `tag`: `cita-{citaId}` (agrupa/reemplaza la notificación de esa cita).
- `url`: `/mi/citas/{citaId}`.
- Nunca incluye celular ni correo de nadie, ni datos de otras personas.

### Textos

| `tipo` | Título | Cuerpo |
|---|---|---|
| `cita_aceptada` | `Tu cita fue aceptada` | `{barbería} · {hoy\|mañana\|dd/mm} {hh:mm a. m./p. m.}` |
| `cita_rechazada` | `Tu solicitud no fue aceptada` | según motivo (abajo) |
| `cita_cancelada` | `Tu cita fue cancelada` | `{barbería} · {fecha y hora}` |
| `cita_expirada` | `Tu solicitud expiró` | `{barbería} no alcanzó a responder. Puedes pedir otro horario.` |

`{barbería}` = `barberos.nombre_barberia`; si no tiene, el nombre del barbero.

Motivos de rechazo:
- `horario_ocupado` → `Ese horario ya está ocupado. Puedes pedir otro.`
- `no_disponible` → `El barbero no está disponible. Puedes pedir otro horario.`
- desconocido → `No fue posible aceptar tu solicitud. Puedes pedir otro horario.`

---

## Reglas de suscripción

- Un `endpoint` es único en `push_subscriptions`. Si ya existe (de un cliente o
  de un barbero), el UPSERT actualiza las llaves y **reasigna** la suscripción
  al cliente actual; la respuesta es `200`.
- Máximo **5 suscripciones por cliente**; al pasar el límite se borran las más
  antiguas (`created_at`, `id`). El barbero conserva su tope de 10.
- `DELETE` solo borra si la suscripción es de ese cliente; si no existe o es de
  otro → `404` (no revela su existencia).

---

## Cuándo se dispara

Siempre **después del commit** de la acción:

| Acción | Tipo |
|---|---|
| El barbero **acepta** la solicitud | `cita_aceptada` |
| El barbero **rechaza** (con motivo) | `cita_rechazada` |
| El barbero **cancela** una cita aceptada | `cita_cancelada` |
| El job pasa a `expirada` | `cita_expirada` (solo las filas que esa corrida expiró) |

- Se envían todas las suscripciones del cliente en paralelo (`Promise.allSettled`)
  con timeout de 5 s por envío.
- Un fallo de push **nunca** rompe la acción ni el job. Solo se registra
  `fallo push cliente cita {id}: {código}`; nunca el endpoint ni las llaves.
- Si el servicio push responde **404 o 410**, esa suscripción se elimina.

---

## Variables de entorno

Las mismas del push del barbero: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
`VAPID_SUBJECT`. No escribas sus valores en documentación ni en el repo.

---

## Prueba con suscripciones falsas

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"cliente1","password":"..."}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken")

# Suscribir (201 la primera vez, 200 al repetir)
curl -X POST http://localhost:3000/cliente/push/suscripcion \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"endpoint":"https://push.invalid/test-1","keys":{"p256dh":"p","auth":"a"}}'

# Cancelar (204)
curl -X DELETE http://localhost:3000/cliente/push/suscripcion \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"endpoint":"https://push.invalid/test-1"}'
```

Limpieza:

```sql
DELETE FROM push_subscriptions WHERE endpoint LIKE 'https://push.invalid/%';
```
