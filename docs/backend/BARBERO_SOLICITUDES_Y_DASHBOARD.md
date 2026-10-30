# Panel del barbero: solicitudes y dashboard

Endpoints **solo para barberos autenticados**. Todos llevan
`@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles('barbero')` y obtienen el
`barberoId` del JWT (`@CurrentBarberoId()`): nunca del body ni de la URL.

- `GET  /barbero/solicitudes`
- `POST /barbero/citas/:id/aceptar`
- `POST /barbero/citas/:id/rechazar`
- `POST /barbero/citas/:id/cancelar`
- `POST /barbero/citas/:id/no-asistio`
- `GET  /barbero/dashboard/hoy`

**Aislamiento:** una cita de otro barbero responde **404** (no 403), para no
revelar que existe. `GET /barbero/solicitudes` solo lista las del barbero del JWT.

---

## `GET /barbero/solicitudes`

Citas en estado `pendiente` **vigentes** (`expira_en > NOW()`), ordenadas por
`expira_en` ascendente: **las más urgentes primero**.

```http
GET /barbero/solicitudes
Authorization: Bearer {token}
```

**200 OK**

```json
[
  {
    "id": 9,
    "estado": "pendiente",
    "fecha": "2026-10-26",
    "horaInicio": "09:00",
    "horaFin": "09:30",
    "cliente": {
      "nombre": "TEST-C1",
      "celular": "3001110001",
      "correo": null
    },
    "numPersonas": 1,
    "montoTotal": 20000,
    "personas": [
      {
        "esTitular": true,
        "nombre": "TEST-C1",
        "duracionTotalMinutos": 30,
        "servicios": [
          { "nombre": "TEST-30", "precio": 20000, "duracionMinutos": 30 }
        ]
      }
    ],
    "minutosFueraHorario": 0,
    "avisoDescanso": null,
    "creadaEn": "2026-10-25T02:35:04.000Z",
    "expiraEn": "2026-10-25T04:35:04.000Z",
    "minutosRestantes": 119,
    "motivoRechazo": null,
    "motivoCancelacion": null
  }
]
```

- `minutosRestantes` solo tiene valor en solicitudes pendientes vigentes.
- **Nunca** se devuelve `tokenSeguimiento`.
- El acompañante aparece con su `nombreAcompanante`; el titular con el nombre del
  cliente.

### Aviso de descanso

Si la cita termina después del fin del bloque (tolerancia de 20 min),
`avisoDescanso` trae:

```
Esta cita se pasa 20 min de tu horario: termina a las 12:20 y tu bloque cierra a las 12:00.
```

Si no invade el bloque, es `null`.

---

## Transiciones

Todas responden **200** con la cita actualizada (mismo DTO) y, cuando aplica,
`whatsappUrl` con el mensaje prellenado para el cliente.

### `POST /barbero/citas/:id/aceptar`

```http
POST /barbero/citas/9/aceptar
Authorization: Bearer {token}
```

- Solo desde `pendiente` y vigente.
- En **una transacción**: bloquea al barbero (`SELECT ... FOR UPDATE`), relee la
  cita con `FOR UPDATE`, verifica que no se cruce con otra cita `aceptada` del
  mismo barbero y la pasa a `aceptada` (`respondido_en = NOW()`).
- Devuelve `whatsappUrl` con el mensaje de confirmación y el link de seguimiento.

Errores:

| Código | Mensaje |
|---|---|
| 404 | `Cita no encontrada` |
| 409 | `Esta solicitud ya fue respondida` |
| 409 | `Esta solicitud expiró (pasaron más de 2 horas)` |
| 409 | `Esta solicitud ya no está disponible` |
| 409 | `Se cruza con otra cita ya aceptada` |

### `POST /barbero/citas/:id/rechazar`

```json
{ "motivo": "horario_ocupado" }
```

`motivo` es obligatorio y solo acepta `horario_ocupado` o `no_disponible`.
Usa un único `UPDATE ... WHERE id = ? AND barbero_id = ? AND estado = 'pendiente'
AND expira_en > NOW()`; guarda `motivo_rechazo`, `respondido_en` y `cerrada_en`.
El horario vuelve a quedar libre y devuelve `whatsappUrl` con el motivo en texto.

Errores: 400 si falta el motivo o es inválido; 409 con los mismos mensajes de
"solicitud ya respondida / expiró / ya no está disponible".

### `POST /barbero/citas/:id/cancelar`

```json
{ "motivo": "Se enfermó el barbero" }
```

`motivo` es opcional (máx. 255). Solo desde `aceptada`; pasa a `cancelada` con
`cerrada_en = NOW()`, el horario queda libre y el seguimiento muestra la
cancelación. Si la cita no está `aceptada` → **409**
`Solo se puede cancelar una cita aceptada`.

### `POST /barbero/citas/:id/no-asistio`

Sin body. Solo desde `aceptada` y **solo después de la hora de inicio** (hora de
Bogotá): fecha anterior a hoy, o misma fecha con la hora ya pasada.

- Antes de la hora → **409**
  `Todavía no es la hora de la cita; si el cliente avisó que no viene, usa Cancelar`.
- Si no está `aceptada` → **409**
  `Solo se puede marcar no asistió una cita aceptada`.

Pasa a `no_asistio` con `cerrada_en = NOW()`. No genera movimiento de dinero.

---

## `GET /barbero/dashboard/hoy`

Resumen del día en hora de Bogotá (`RelojPort`).

```json
{
  "fecha": "2026-10-24",
  "resumen": {
    "citasHoy": 1,
    "aceptadas": 1,
    "atendidas": 0,
    "noAsistio": 0,
    "solicitudesPendientes": 2
  },
  "bloquesDeTrabajo": [
    { "horaInicio": "07:00", "horaFin": "23:45" }
  ],
  "citas": [
    {
      "id": 14,
      "estado": "aceptada",
      "horaInicio": "22:30",
      "horaFin": "23:00",
      "puedeMarcarNoAsistio": false,
      "...": "resto del DTO de cita"
    }
  ],
  "huecosLibres": [
    { "horaInicio": "21:26", "horaFin": "22:30" },
    { "horaInicio": "23:00", "horaFin": "23:45" }
  ]
}
```

- `citas`: las de hoy en estado `aceptada`, `atendida` o `no_asistio`, por hora
  de inicio.
- `puedeMarcarNoAsistio`: `true` solo si está `aceptada` y ya pasó su hora.
- `solicitudesPendientes`: pendientes vigentes de cualquier fecha.
- `huecosLibres`: bloques de hoy menos las ocupaciones (`aceptada` y `pendiente`
  vigente), desde la hora actual, uniendo ocupaciones contiguas y omitiendo
  huecos menores a 15 min.
- `resumen.citasHoy` cuenta las citas del día listadas (no las pendientes).

---

## Mensajes de WhatsApp

Cada acción devuelve `whatsappUrl` armado con
`https://wa.me/57{celular}?text={mensaje}`:

| Acción | Mensaje |
|---|---|
| Aceptar | `Hola {nombre}, tu cita en {barbería} quedó confirmada para el {fecha} a las {hora}. Puedes ver su estado aquí: {seguimientoUrl}` |
| Rechazar | `Hola {nombre}, lamentablemente no puedo atenderte el {fecha} a las {hora} ({motivo}). Puedes elegir otro horario aquí: {linkReservas}` |
| Cancelar | `Hola {nombre}, tengo que cancelar tu cita del {fecha} a las {hora}. Disculpa el inconveniente. Puedes reservar otro horario aquí: {linkReservas}` |

Fechas y horas legibles en español (`lunes 26 de octubre`, `10:00 a. m.`) con
`Intl` y `timeZone: 'UTC'` sobre las fechas construidas en UTC.

---

## Códigos de error transversales

| Código | Caso |
|---|---|
| 400 | `id` no numérico, body inválido, campo extra, motivo de rechazo inválido |
| 401 | Sin token o token inválido/expirado |
| 403 | Token de cliente (`tipo !== 'barbero'`) |
| 404 | Cita inexistente o de otro barbero |
| 409 | Transición no permitida por el estado o la hora |

## Cómo probar

```bash
# login
curl -X POST http://localhost:3000/auth/login/barbero \
  -H "Content-Type: application/json" \
  -d '{"username":"barbero1","password":"..."}'

# solicitudes
curl http://localhost:3000/barbero/solicitudes -H "Authorization: Bearer $TOKEN"
```

Crea las citas de prueba con el POST público usando nombres que empiecen por
`TEST-` y al final limpia con:

```sql
DELETE FROM citas WHERE invitado_nombre LIKE 'TEST-%';
```

(`cita_personas` y `cita_persona_servicios` se borran en cascada).
