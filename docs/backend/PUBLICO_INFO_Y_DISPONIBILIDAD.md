# API pública: información del barbero y disponibilidad

Endpoints **sin JWT** para la página pública de reserva (`/b/{codigo}`). Esta fase
es **solo lectura**: todavía no se crean citas. No hay nada de pagos (Fase 2).

Base URL: `http://localhost:3000`.

- `GET /public/barberos/:codigo`
- `GET /public/barberos/:codigo/disponibilidad?fecha=YYYY-MM-DD&duracionMinutos=N`

Reglas comunes:

- El barbero se resuelve **siempre por su código** en el servidor; el cliente
  nunca envía un `barberoId`.
- El código debe cumplir `^[A-Za-z0-9-]{4,20}$`. Si el formato es inválido se
  responde **404 con el mismo mensaje** que un código inexistente.
- Límite: **30 peticiones por minuto por IP** en cada endpoint público (además
  del límite global de 300/min).
- `Cache-Control: no-store` en la disponibilidad.
- Nunca se exponen `id`, `correo`, `username`, `passwordHash`, `estadoCuenta` ni
  `codigoUnico`.

---

## GET `/public/barberos/:codigo`

Datos públicos del barbero y sus servicios **activos**.

**Request**

```http
GET /public/barberos/BARB-0001
```

**200 OK** — barbero activo con servicios y horarios:

```json
{
  "nombres": "Barbero",
  "nombreBarberia": "Barbería Demo",
  "reservasDisponibles": true,
  "servicios": [
    {
      "id": 1,
      "nombre": "Corte de cabello",
      "descripcion": "Corte clásico",
      "precio": 25000,
      "duracionMinutos": 30
    }
  ]
}
```

`reservasDisponibles` es `true` solo si el barbero está **activo**, tiene al menos
un **servicio activo** y al menos un **bloque de horario activo**.

**200 OK** — barbero suspendido o vencido (no revela más datos):

```json
{
  "nombres": "Barbero",
  "nombreBarberia": "Barbería Demo",
  "reservasDisponibles": false,
  "servicios": []
}
```

**404 Not Found** — código inexistente o con formato inválido:

```json
{
  "message": "Barbero no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

**429** si se supera el límite de peticiones.

---

## GET `/public/barberos/:codigo/disponibilidad`

Devuelve los inicios posibles de cita para un día y una duración, con el estado de
cada horario.

**Query**

| Parámetro | Obligatorio | Reglas |
|---|---|---|
| `fecha` | sí | `YYYY-MM-DD`, fecha real del calendario, entre **hoy** y **hoy + 7 días** (hora de Bogotá) |
| `duracionMinutos` | sí | entero, 5–600, **divisible por 5** |

**Request**

```http
GET /public/barberos/BARB-0001/disponibilidad?fecha=2026-10-26&duracionMinutos=30
```

**200 OK**

```json
{
  "fecha": "2026-10-26",
  "duracionMinutos": 30,
  "cuadriculaMinutos": 15,
  "slots": [
    { "horaInicio": "07:00", "horaFin": "07:30", "estado": "verde", "minutosFueraDeHorario": 0 },
    { "horaInicio": "07:15", "horaFin": "07:45", "estado": "verde", "minutosFueraDeHorario": 0 },
    { "horaInicio": "08:45", "horaFin": "09:15", "estado": "rojo", "minutosFueraDeHorario": 0 },
    { "horaInicio": "14:45", "horaFin": "15:15", "estado": "naranja", "minutosFueraDeHorario": 0 }
  ]
}
```

- `slots` viene **ordenado por hora de inicio**.
- `minutosFueraDeHorario` indica cuántos minutos de la cita quedan después del fin
  del bloque (0 si termina dentro).
- Día sin horario activo o barbero suspendido/vencido → `"slots": []`.

### Reglas de la cuadrícula

- Los inicios van cada **15 minutos** desde el inicio de cada bloque.
- La cita debe **empezar dentro del bloque** y puede terminar hasta **20 minutos
  después** de su fin (tolerancia). Ej.: bloque 07:00–12:00 y servicio de 50 min →
  11:15 (termina 12:05) y 11:30 (termina 12:20) se ofrecen; 11:45 (termina 12:35)
  no.
- La tolerancia **nunca invade el siguiente bloque**: el límite de fin es
  `min(fin del bloque + 20, inicio del bloque siguiente)`. Si el siguiente bloque
  empieza justo cuando termina este, no hay tolerancia.
- No se puede cruzar el hueco entre bloques (ej. 07:00–12:00 y 14:00–18:00).
- Se admiten varios bloques por día.
- **Horizonte de reserva:** desde hoy hasta hoy + 7 días (hora de Bogotá).
- **Anticipación mínima:** si `fecha` es **hoy**, el primer inicio posible es
  `ahora + 30 minutos`, redondeado hacia arriba a múltiplos de 15. Para otros días
  no aplica.
- La duración total es la de la cita completa (titular + acompañantes), calculada
  por el frontend y enviada como `duracionMinutos`.

### Colores (`estado`)

| Estado | Significado |
|---|---|
| `verde` | libre; se puede reservar |
| `naranja` | se cruza con una cita `pendiente` vigente (solicitud esperando al barbero) |
| `rojo` | se cruza con una cita `aceptada` |

- Una cita `pendiente` solo ocupa mientras no venza su `expira_en`; la comparación
  se hace en SQL con `NOW()`.
- Las citas `pendiente_pago` de la Fase 2 se tratan como `pendiente` mientras su
  retención siga vigente.
- `rojo` tiene prioridad sobre `naranja`.
- Que una cita termine justo cuando empieza otra **no** es cruce.
- El cliente solo puede elegir slots `verde`.

### Errores de validación (400)

```json
{
  "message": ["fecha debe tener formato YYYY-MM-DD"],
  "error": "Bad Request",
  "statusCode": 400
}
```

```json
{
  "message": "Fecha fuera del rango de reservas",
  "error": "Bad Request",
  "statusCode": 400
}
```

```json
{
  "message": "Fecha inválida",
  "error": "Bad Request",
  "statusCode": 400
}
```

`2026-02-30` devuelve **400** (`Fecha inválida`). Fechas pasadas o a más de 7 días
devuelven **400** (`Fecha fuera del rango de reservas`).

`duracionMinutos` ausente, no entero, `0`, `33` o `601` → **400**.

**404** si el código no existe o tiene formato inválido (mismo mensaje que arriba).

---

## Límites de peticiones

| Endpoint | Límite |
|---|---|
| `GET /public/barberos/:codigo` | 30 por 60 s por IP |
| `GET /public/barberos/:codigo/disponibilidad` | 30 por 60 s por IP |
| `POST /auth/login/cliente` | 10 por 60 s por IP |
| `POST /auth/login/barbero` | 10 por 60 s por IP |
| Resto de endpoints | 300 por 60 s por IP (global) |

Al superar el límite:

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

`main.ts` configura `trust proxy = 1` para que el límite use la IP real detrás del
proxy de Clever Cloud. **Verificar en producción cuántos proxies hay** y ajustar el
valor si es necesario.

## CORS

El origen permitido es `APP_PUBLIC_URL` (`.env`). Si el frontend usa más orígenes,
agregarlos en `main.ts`.

## Tablas consultadas

- `barberos` (por `codigo_unico`, `estado_cuenta`)
- `servicios` (activos del barbero)
- `horarios_trabajo` (bloques activos del día)
- `citas` (solo `hora_inicio`, `hora_fin`, `estado`, `expira_en` del día)

Sin cambios de esquema.
