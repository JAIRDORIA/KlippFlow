# Compras y balance diario (historial de 30 días)

Endpoints **solo para barberos autenticados** (`JwtAuthGuard` + `RolesGuard` +
`@Roles('barbero')`). El `barberoId` sale siempre del JWT
(`@CurrentBarberoId()`): **enviarlo en el body da 400**. Una compra de otro
barbero responde **404** (no 403) para no revelar su existencia.

- `POST   /barbero/compras` — registra una compra y suma al balance del día.
- `GET    /barbero/compras?fecha=YYYY-MM-DD` — compras del día (por defecto hoy).
- `PATCH  /barbero/compras/:id` — edita una compra del mismo día.
- `DELETE /barbero/compras/:id` — elimina una compra del mismo día.
- `GET    /barbero/balance/hoy` — resumen del día actual en Bogotá.
- `GET    /barbero/balance/historial` — 30 días, del más reciente al más antiguo.

---

## Reglas de negocio

### Compra

- `descripcion`: texto de **1 a 150 caracteres**, sin espacios sobrantes al
  inicio ni al final (la API recorta con trim).
- `monto`: **entero en pesos** entre **1 y 50.000.000**.
- `fechaBalance` (`compras.fecha_balance`, DATE) es **hoy en Bogotá** según
  `RelojPort`. El cliente **nunca** la envía (si lo hace → 400).
- No hay detalle de inventario: solo descripción y monto.

### Balance (modelo de caja)

El resumen diario vive en `balance_resumen_diario` y **no guarda detalle**,
solo totales. Se reinicia a las **12:00 a. m. de Bogotá** y el historial cubre
los **últimos 30 días** (incluido hoy).

En la Fase 1:

```
ganancia_neta = total_servicios + total_propinas − total_compras
```

`total_anticipos` y `total_devoluciones` existen pero valen 0 hasta la Fase 2.

Cada compra, **en la misma transacción** que la inserta:

```
total_compras += monto
ganancia_neta  -= monto
```

Se usa upsert incremental (`INSERT ... ON DUPLICATE KEY UPDATE
total_compras = total_compras + ?, ganancia_neta = ganancia_neta - ?`, sin
`VALUES()`). Si no hay fila del día, el upsert la crea con ceros y los valores
de la compra. El balance **puede quedar negativo** (compras sin ingresos).

### Editar / borrar

- Solo se permite el **mismo día** de su `fecha_balance`. Después → **409**.
- Editar ajusta el balance por la **diferencia**:
  `delta = nuevoMonto − montoAnterior`.
- Borrar **revierte el monto completo**.
- Todo corre en una transacción con `SELECT ... FOR UPDATE` sobre la compra y
  validación de `barbero_id`.

### GET /barbero/compras?fecha=

- `fecha` opcional; por defecto **hoy**.
- Solo se acepta una fecha dentro de los **últimos 30 días** y **no futura**
  (si no → 400).
- Devuelve las compras **ordenadas de la más reciente a la más antigua**.

### GET /barbero/balance/historial

- Devuelve **30 elementos** (hoy primero, hace 29 días al final).
- Los días sin fila se rellenan con **ceros** en el servidor.
- La consulta a la BD trae el rango en una sola query.

---

## POST /barbero/compras

Body:

```json
{ "descripcion": "TEST-Navajas", "monto": 20000 }
```

**201 Created**

```json
{
  "compra": {
    "id": 1,
    "descripcion": "TEST-Navajas",
    "monto": 20000,
    "fechaBalance": "2026-10-24"
  },
  "balance": {
    "fecha": "2026-10-24",
    "totalAnticipos": 0,
    "totalServicios": 0,
    "totalPropinas": 0,
    "totalDevoluciones": 0,
    "totalCompras": 20000,
    "gananciaNeta": -20000
  }
}
```

| Código | Caso |
|---|---|
| 400 | `monto` no entero, 0, negativo, decimal, texto o mayor a 50.000.000 |
| 400 | `descripcion` vacía, solo espacios o de más de 150 caracteres |
| 400 | Enviar `barberoId` o `fechaBalance` en el body (campos no permitidos) |
| 401 | Sin token / token inválido |
| 403 | Token de cliente |

---

## GET /barbero/compras

**200 OK**

```json
{
  "fecha": "2026-10-24",
  "total": 20000,
  "compras": [
    {
      "id": 1,
      "descripcion": "TEST-Navajas",
      "monto": 20000,
      "fechaBalance": "2026-10-24"
    }
  ]
}
```

| Código | Caso |
|---|---|
| 400 | `?fecha=` con formato inválido, fecha futura o con más de 30 días |
| 401 / 403 | Sin token / token de cliente |

---

## PATCH /barbero/compras/:id

Body (al menos un campo):

```json
{ "monto": 30000 }
```

```json
{ "descripcion": "TEST-Navajas nuevas" }
```

**200 OK** — misma forma que el POST (`compra` + `balance` actualizado).

| Código | Caso |
|---|---|
| 400 | Body vacío o campos inválidos |
| 401 / 403 | Sin token / token de cliente |
| 404 | `Compra no encontrada` (inexistente o de otro barbero) |
| 409 | `Solo puedes modificar una compra el mismo día en que se registró` |

---

## DELETE /barbero/compras/:id

**204 No Content** (sin body).

| Código | Caso |
|---|---|
| 401 / 403 | Sin token / token de cliente |
| 404 | `Compra no encontrada` (inexistente o de otro barbero) |
| 409 | `Solo puedes eliminar una compra el mismo día en que se registró` |

---

## GET /barbero/balance/hoy

**200 OK** (ceros si no hay fila)

```json
{
  "fecha": "2026-10-24",
  "totalAnticipos": 0,
  "totalServicios": 30000,
  "totalPropinas": 5000,
  "totalDevoluciones": 0,
  "totalCompras": 20000,
  "gananciaNeta": 15000
}
```

---

## GET /barbero/balance/historial

**200 OK** — arreglo de **30 elementos**, del más reciente al más antiguo,
incluyendo hoy; los días sin movimiento van en ceros.

```json
[
  {
    "fecha": "2026-10-24",
    "totalAnticipos": 0,
    "totalServicios": 30000,
    "totalPropinas": 5000,
    "totalDevoluciones": 0,
    "totalCompras": 20000,
    "gananciaNeta": 15000
  },
  {
    "fecha": "2026-10-23",
    "totalAnticipos": 0,
    "totalServicios": 0,
    "totalPropinas": 0,
    "totalDevoluciones": 0,
    "totalCompras": 0,
    "gananciaNeta": 0
  }
]
```

---

## Transaccionalidad y concurrencia

- Crear/editar/borrar corren en `DataSource.transaction`.
- El upsert del balance es atómico; 10 compras simultáneas acumulan
  exactamente 10 × monto.
- PATCH y DELETE simultáneos sobre la misma compra se serializan con
  `FOR UPDATE`: solo una de las dos deja efecto neto coherente, sin doble
  descuento.
- El pool de MySQL está limitado a 4 conexiones porque Clever Cloud fija
  `max_user_connections = 5`; así las peticiones se encolan en lugar de fallar.

---

## Cómo probar

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login/barbero \
  -H "Content-Type: application/json" \
  -d '{"username":"barbero1","password":"..."}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).accessToken")

# Crear compra
curl -X POST http://localhost:3000/barbero/compras \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"descripcion":"TEST-Navajas","monto":20000}'

# Compras de hoy (o de otra fecha de los últimos 30 días)
curl http://localhost:3000/barbero/compras -H "Authorization: Bearer $TOKEN"
curl "http://localhost:3000/barbero/compras?fecha=2026-10-23" \
  -H "Authorization: Bearer $TOKEN"

# Editar y eliminar (solo el mismo día)
curl -X PATCH http://localhost:3000/barbero/compras/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"monto":30000}'
curl -X DELETE http://localhost:3000/barbero/compras/1 \
  -H "Authorization: Bearer $TOKEN"

# Balance
curl http://localhost:3000/barbero/balance/hoy \
  -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/barbero/balance/historial \
  -H "Authorization: Bearer $TOKEN"

# Concurrencia
node scripts/prueba-concurrencia-compras.js "$TOKEN"
```

Limpieza de datos de prueba:

```sql
DELETE FROM compras WHERE descripcion LIKE 'TEST-%';

DELETE FROM balance_resumen_diario
WHERE barbero_id = 1 AND fecha IN ('2026-10-24', '2026-10-23', '2026-10-21');
```
