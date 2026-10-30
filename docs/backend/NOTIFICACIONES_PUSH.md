# Notificaciones push al barbero (Web Push)

Solo se notifica al **barbero**. Al crearse una cita pública (`estado =
pendiente`), el backend dispara una notificación **fire and forget** DESPUÉS de
que la transacción de la reserva hizo commit. El envío nunca retiene una
conexión de BD ni puede hacer fallar o demorar la reserva: si el push falla,
solo se registra en el log.

- `GET    /barbero/push/llave-publica` — llave pública VAPID.
- `POST   /barbero/push/suscripciones` — suscribir/actualizar dispositivo.
- `DELETE /barbero/push/suscripciones` — cancelar suscripción.
- `POST   /barbero/push/probar` — envía una notificación de prueba.

Todos con `JwtAuthGuard` + `RolesGuard` + `@Roles('barbero')`. El `barberoId`
sale SIEMPRE del JWT (`@CurrentBarberoId()`); enviarlo en el body da **400**.

---

## Reglas de negocio

- Un barbero puede tener **varias suscripciones** (varios dispositivos). Se
  envía a todas las suyas.
- Solo `usuario_tipo = 'barbero'` (aunque la tabla soporta `cliente`).
- Una misma suscripción (`endpoint`) es **única**: si ya existe, se actualizan
  sus llaves y se **reasigna** al barbero actual (caso de dos barberos en el
  mismo dispositivo).
- **Máximo 10 suscripciones por barbero**: al pasar el límite se borran las más
  antiguas (`created_at`, `id`).
- Si el servicio push responde **404 o 410** (suscripción caducada), esa
  suscripción se **elimina** de `push_subscriptions`. Otros errores solo se
  registran en el log.
- El payload NO incluye celular ni correo del cliente.

### Contenido de la notificación

- Título: `Nueva solicitud de cita`.
- Cuerpo: nombre del cliente (truncado a 40 caracteres) + fecha/hora en Bogotá.
  - Hoy: `Carlos · hoy 3:30 p. m.`
  - Mañana: `Carlos · mañana 9:05 a. m.`
  - Otra fecha: `Carlos · sáb 31 oct, 3:30 p. m.`
- `url` interna para abrir la lista de solicitudes: `/solicitudes`.

---

## Variables de entorno (solo nombres)

```
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=        # ej. mailto:jair@barberapp.com
```

Las lee el notificador con `configService.getOrThrow`. No escribas los valores
en documentación ni los subas al repo.

### Generar claves VAPID

```bash
node scripts/generar-vapid.js
```

El script imprime el par de claves en consola (no escribe archivos ni toca el
`.env`). Copia los valores a tu `.env` local. La llave pública es la que el
frontend usa en `pushManager.subscribe()`.

---

## Endpoints

### GET /barbero/push/llave-publica

**200 OK**

```json
{ "publicKey": "<VAPID_PUBLIC_KEY>" }
```

| Código | Caso |
|---|---|
| 401 | Sin token / token inválido |
| 403 | Token de cliente |

### POST /barbero/push/suscripciones

Body:

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BN...",
    "auth": "abc..."
  }
}
```

- **201 Created** si la suscripción es nueva.
- **200 OK** si ya existía y se actualizó/reasignó.

Ambos devuelven `{ "creada": true | false }`.

| Código | Caso |
|---|---|
| 400 | `endpoint` no https, vacío o de más de 500 caracteres |
| 400 | falta `keys`, `p256dh` o `auth` vacíos o de más de 255 |
| 400 | enviar `barberoId` o `usuarioId` en el body |
| 401 / 403 | Sin token / token de cliente |
| 429 | Más de 20 peticiones/min |

### DELETE /barbero/push/suscripciones

Body:

```json
{ "endpoint": "https://fcm.googleapis.com/fcm/send/..." }
```

**204 No Content**. Solo borra si pertenece al barbero del token; si no existe
o es de otro barbero → **404** (no se revela su existencia).

| Código | Caso |
|---|---|
| 400 | `endpoint` inválido |
| 401 / 403 | Sin token / token de cliente |
| 404 | `Suscripción no encontrada` |
| 429 | Más de 20 peticiones/min |

### POST /barbero/push/probar

**200 OK**

```json
{ "enviados": 1, "eliminados": 0, "fallidos": 0 }
```

Envía una notificación de prueba a todas las suscripciones del barbero.

| Código | Caso |
|---|---|
| 404 | `No tienes suscripciones push registradas en este dispositivo` |
| 401 / 403 | Sin token / token de cliente |
| 429 | Más de 3 peticiones/min |

---

## Comportamiento del envío

- `web-push` con VAPID (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
  `VAPID_SUBJECT`).
- TTL de **1 hora** y timeout de **10 s** por envío.
- Envío a varias suscripciones **en paralelo con tope de 3**.
- `PushNotifierPort.enviarABarbero()` **nunca lanza** hacia el caso de uso:
  devuelve `{ enviados, eliminados, fallidos }`.
- La llamada desde la creación de cita es `void promesa.catch(log)`.

---

## Cómo probar (sin navegador)

Usa suscripciones FALSAS con endpoints inventados:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login/barbero \
  -H "Content-Type: application/json" \
  -d '{"username":"barbero1","password":"..."}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken")

# Suscripción falsa
curl -X POST http://localhost:3000/barbero/push/suscripciones \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"endpoint":"https://push.test/1","keys":{"p256dh":"p","auth":"a"}}'

# Probar envío (fallará contra el endpoint falso, sin 500)
curl -X POST http://localhost:3000/barbero/push/probar \
  -H "Authorization: Bearer $TOKEN"
```

Limpieza:

```sql
DELETE FROM push_subscriptions WHERE endpoint LIKE 'https://push.test/%';
```

---

## Pendiente de validar con dispositivo real

- La entrega real al service worker de una PWA (iOS/Android) **no se puede
  probar con esta suite**: los endpoints falsos solo validan el flujo, los
  códigos HTTP, el throttling y el manejo de errores.
- Queda por probar desde la PWA: permiso de notificaciones,
  `pushManager.subscribe()`, recepción del push con el payload aquí definido y
  el clic en la notificación abriendo `/solicitudes`.
