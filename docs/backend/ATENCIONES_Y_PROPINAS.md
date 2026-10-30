# Atenciones ("Atendido") y propinas

Endpoints **solo para barberos autenticados** (`JwtAuthGuard` + `RolesGuard` +
`@Roles('barbero')`). El `barberoId` sale siempre del JWT
(`@CurrentBarberoId()`).

- `POST /barbero/citas/:id/atendido` — registra la atención y suma al balance.
- `PUT  /barbero/citas/:id/propina` — corrige la propina del mismo día.

Una cita de otro barbero responde **404**.

---

## Reglas de negocio

### "Atendido"

- Solo una cita en estado **`aceptada`** puede marcarse atendida.
- Su `fecha` debe ser **hoy o anterior** (hoy = fecha de Bogotá según
  `RelojPort`). Una cita futura → **409**.
- `monto_cobrado = citas.monto_total`.
- `anticipo_aplicado = citas.monto_anticipo` (0 en la Fase 1).
- `saldo_cobrado = max(0, monto_cobrado − anticipo_aplicado)`. Montos enteros.
- La cita pasa a **`atendida`** y se llena `cerrada_en`.
- Propina opcional: entero entre **1 y 1.000.000**.
  `dejo_propina = true` si hay propina, `monto_propina` con el valor.

### Balance (modelo de caja)

El día del balance es **HOY en Bogotá** en el momento de presionar "Atendido"
(no la fecha de la cita: si atiendes hoy una cita de ayer, entra al balance de
hoy).

En **la misma transacción**:

```
total_servicios += saldo_cobrado
total_propinas  += propina (o 0)
ganancia_neta   += saldo_cobrado + propina
```

El resumen se guarda en `balance_resumen_diario` con
`ON DUPLICATE KEY UPDATE` sobre `(barbero_id, fecha)`.

### Propina después

- La propina se puede corregir **solo el mismo día del balance**
  (`atenciones.fecha_balance`). Después → **409**.
- Se envía el **nuevo valor total** de la propina.
- Se aplica la **diferencia** al balance del día: `delta = nuevo − anterior`.
- `0` quita la propina (`dejo_propina = false`, `monto_propina = NULL`) y resta
  del balance lo que se había sumado.
- Si el balance del día ya existía, se ajusta; si no, se crea con el delta.

### Transaccionalidad

`registrarAtencion` y `actualizarPropina` corren en `DataSource.transaction`:

1. `SELECT ... FOR UPDATE` de la cita (o de la atención) filtrando por
   `barbero_id`.
2. Validaciones de estado y fecha.
3. `INSERT` en `atenciones` (la restricción **única de `cita_id`** es la red de
   seguridad contra doble registro).
4. `UPDATE citas` a `atendida`.
5. `INSERT ... ON DUPLICATE KEY UPDATE` del balance con parámetros.

Dos POST simultáneos de "Atendido" sobre la misma cita producen exactamente un
**200** y un **409**: el segundo espera el `FOR UPDATE` y ve la cita ya
`atendida`.

### Limitación conocida: no hay "deshacer"

No existe reversa de una atención. Si se marcó por error:

- La cita no puede volver a `aceptada`.
- El cobro ya quedó sumado al balance del día.
- La propina sí se puede corregir (incluido 0) el mismo día.

Se decidió no implementar "deshacer" en la Fase 1; si se necesita, sería un
endpoint nuevo con su propio registro de auditoría.

---

## `POST /barbero/citas/:id/atendido`

Body **opcional**:

```json
{ "montoPropina": 5000 }
```

Sin body también funciona (sin propina).

**200 OK**

```json
{
  "citaId": 16,
  "estado": "atendida",
  "atencion": {
    "citaId": 16,
    "montoCobrado": 30000,
    "anticipoAplicado": 0,
    "saldoCobrado": 30000,
    "montoPropina": 5000,
    "totalRecibido": 35000
  }
}
```

| Código | Caso |
|---|---|
| 400 | `montoPropina` no entero, menor a 1, mayor a 1.000.000 o campo extra |
| 401 | Sin token / token inválido |
| 403 | Token de cliente |
| 404 | Cita inexistente o de otro barbero |
| 409 | `Esta cita ya fue marcada como atendida` |
| 409 | `Solo se puede marcar como atendida una cita aceptada` |
| 409 | `Esta cita es de una fecha futura` |

---

## `PUT /barbero/citas/:id/propina`

Body **obligatorio**:

```json
{ "montoPropina": 8000 }
```

`0` quita la propina.

**200 OK**

```json
{
  "citaId": 16,
  "atencion": {
    "citaId": 16,
    "montoCobrado": 30000,
    "anticipoAplicado": 0,
    "saldoCobrado": 30000,
    "montoPropina": 8000,
    "totalRecibido": 38000
  }
}
```

| Código | Caso |
|---|---|
| 400 | `montoPropina` no entero, negativo, mayor a 1.000.000 o campo extra |
| 401 / 403 | Sin token / token de cliente |
| 404 | `Atención no encontrada` (cita de otro barbero o sin atención) |
| 409 | `Solo puedes modificar la propina el mismo día de la atención` |

---

## El dashboard muestra la atención

`GET /barbero/dashboard/hoy` incluye en cada cita:

```json
"atencion": {
  "montoCobrado": 30000,
  "saldoCobrado": 30000,
  "montoPropina": 5000
}
```

`null` si la cita todavía no está atendida.

---

## Cómo probar

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login/barbero \
  -H "Content-Type: application/json" \
  -d '{"username":"barbero1","password":"..."}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken")

# Atendido sin propina
curl -X POST http://localhost:3000/barbero/citas/16/atendido \
  -H "Authorization: Bearer $TOKEN"

# Atendido con propina
curl -X POST http://localhost:3000/barbero/citas/17/atendido \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"montoPropina":5000}'

# Corregir / quitar propina
curl -X PUT http://localhost:3000/barbero/citas/16/propina \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"montoPropina":8000}'
```

Deja las citas de prueba **aceptadas** con SQL (la fecha de hoy debe calcularse
en Bogotá, no `CURDATE()` porque el servidor de BD puede estar en otra zona):

```sql
-- Ejemplo con la fecha que devuelve Node en Bogotá
INSERT INTO citas (barbero_id, cliente_id, invitado_nombre, invitado_celular,
  token_seguimiento, fecha, hora_inicio, hora_fin, minutos_fuera_horario,
  va_solo, num_acompanantes, estado, monto_total, porcentaje_anticipo,
  monto_anticipo, estado_pago, expira_en, respondido_en)
VALUES (1, NULL, 'TEST-ATENDIDO-1', '3001110101',
  'd7d1c0b9c1e497864ad35078c3aa7731', '2026-10-24', '10:00:00', '10:30:00',
  0, 1, 0, 'aceptada', 30000, 0, 0, 'no_aplica',
  DATE_ADD(NOW(), INTERVAL 2 HOUR), NOW());

INSERT INTO cita_personas (cita_id, es_titular, nombre_acompanante,
  duracion_total_minutos)
SELECT id, 1, NULL, 30 FROM citas WHERE invitado_nombre = 'TEST-ATENDIDO-1';
```

Para mover una atención a otro día y probar el 409 de la propina:

```sql
UPDATE atenciones SET fecha_balance = DATE_SUB(fecha_balance, INTERVAL 1 DAY)
WHERE cita_id = 16;
```

Limpieza:

```sql
DELETE FROM citas WHERE invitado_nombre LIKE 'TEST-%';  -- atenciones en cascada
DELETE FROM balance_resumen_diario
WHERE barbero_id = 1 AND fecha = '2026-10-24';          -- día de la prueba
```
