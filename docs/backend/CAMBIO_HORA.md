# Cambio de hora propuesto (contrato)

El barbero propone una nueva fecha/hora sobre una cita **pendiente vigente** o
**aceptada futura**; el cliente la acepta o la rechaza desde su cuenta. Copia de
referencia del backend (`Klipp-flow-backend`, commit `1a555b6`). No se inventan
campos.

Todos los endpoints de barbero llevan `Authorization: Bearer {tokenBarbero}` y
los de cliente `Authorization: Bearer {tokenCliente}`. El `barberoId` y el
`clienteId` salen siempre del JWT.

---

## Reglas

- La propuesta vive **1 hora** (`creadaEn` → `expiraEn`).
- Mientras está vigente, el horario propuesto queda bloqueado como ocupación
  **tentativa** (naranja en la disponibilidad); la hora original sigue bloqueada.
- Pendiente + acepta → la cita pasa a `aceptada` en la nueva hora.
- Pendiente + rechaza → pasa a `rechazada` con motivo `cambio_hora_rechazado`.
- Pendiente + 1 h sin responder → pasa a `rechazada` con motivo
  `cambio_hora_no_respondida`.
- Aceptada + acepta → sigue `aceptada`, pero en la nueva hora.
- Aceptada + rechaza o no responde → sigue `aceptada` en su hora original; solo
  se descarta la propuesta.
- Los recordatorios se reprograman solos en el backend.
- Una propuesta nueva **reemplaza** la anterior de la misma cita y vuelve a
  avisar al cliente.
- Job `limpiar-propuestas-vencidas` (cada minuto) cierra o descarta las
  propuestas vencidas.

---

## Barbero

### `GET /barbero/citas/:id/disponibilidad?fecha=YYYY-MM-DD`

Slots para la **duración total** de esa cita, excluyéndola a ella misma de las
ocupaciones. Misma forma y reglas que la disponibilidad pública
(`verde/naranja/rojo`, cuadrícula de 15 min, tolerancia de 20 min y anticipación
de 30 min para hoy).

```json
{
  "fecha": "2026-11-20",
  "duracionMinutos": 30,
  "cuadriculaMinutos": 15,
  "slots": [
    {
      "horaInicio": "09:00",
      "horaFin": "09:30",
      "estado": "verde",
      "minutosFueraHorario": 0
    }
  ]
}
```

`fecha` debe estar entre hoy y hoy + 7 días (hora de Bogotá).

### `POST /barbero/citas/:id/proponer-cambio-hora`

```json
{ "fecha": "2026-11-20", "horaInicio": "09:00" }
```

- Solo sobre `pendiente` vigente o `aceptada` que no haya comenzado.
- El slot debe quedar **verde** y ser distinto a la hora actual.
- Responde **200** con el `CitaBarberoResponseDto` (el mismo del panel) y el
  campo nuevo:

```json
{
  "propuestaCambioHora": {
    "fecha": "2026-11-20",
    "horaInicio": "09:00",
    "horaFin": "09:30",
    "creadaEn": "2026-11-15T20:00:00.000Z",
    "expiraEn": "2026-11-15T21:00:00.000Z"
  }
}
```

- Incluye `whatsappUrl` con el mensaje prellenado de la propuesta.

Errores:

| Código | Cuándo |
|---|---|
| `400` | fecha/hora inválida, fuera de rango, fuera de la cuadrícula o igual a la actual |
| `404` | cita inexistente o de otro barbero |
| `409` | estado no permitido, solicitud expirada, cita ya comenzada, cliente sin cuenta de cliente o horario ocupado |

---

## Cliente

`GET /cliente/citas` y `GET /cliente/citas/:id` incluyen `propuestaCambioHora`
con la misma forma (`null` si no hay propuesta vigente o ya venció).

### `POST /cliente/citas/:id/cambio-hora/aceptar`

Sin body. Devuelve `CitaClienteDetalleResponseDto` actualizado. El slot original
se libera y el nuevo queda ocupado.

### `POST /cliente/citas/:id/cambio-hora/rechazar`

Sin body. Devuelve la cita actualizada.

Errores: `404` cita inexistente o de otro cliente; `409` sin propuesta vigente,
propuesta expirada o slot ya ocupado (en ese caso el backend descarta la
propuesta).

---

## Pushes

Cliente, al proponerse la hora:

```json
{
  "titulo": "Tu barbero propone otra hora",
  "cuerpo": "Barbería El Rey · mañana 9:30 a. m. (antes hoy 3:30 p. m.)",
  "url": "/mi/citas/42",
  "tag": "cita-42",
  "tipo": "cita_hora_propuesta",
  "citaId": 42
}
```

Barbero, al resolverse la propuesta (`{titulo, cuerpo, url}` sin `tipo` ni
`citaId`):

- «El cliente aceptó la nueva hora» — `url: "/"`.
- «El cliente rechazó la nueva hora» — `url: "/solicitudes"`.
- «El cliente no respondió el cambio de hora» — `url: "/solicitudes"`.
- «El cliente no aceptó la nueva hora» (la cita ya estaba aceptada y conserva su
  hora) — `url: "/"`.
