# Cambio de hora propuesto — Frontend

Contrato de referencia: `docs/backend/CAMBIO_HORA.md`. No se inventaron campos.

El barbero propone otra hora sobre una cita **pendiente** o **aceptada** y el
cliente responde desde su cuenta. No hay rutas nuevas: la acción del barbero vive
en un Sheet y la respuesta del cliente en el detalle de su cita.

## Rutas y puntos de entrada

| Dónde | Qué se hace |
|---|---|
| `/app/solicitudes` | Botón «Proponer otra hora» en cada tarjeta (y «Cambiar la propuesta» si ya hay una activa). |
| `/app/hoy` | Acción compacta «Proponer» / «Cambiar» en las citas aceptadas. |
| `/mi/citas/:id` | Banner «Nueva hora propuesta» con hora nueva, hora anterior, tiempo restante y botones Aceptar / Rechazar. |
| `/mi`, `/mi/citas` | La tarjeta de la cita muestra el chip «Nueva hora propuesta» con el horario y enlaza al detalle. |
| Push `cita_hora_propuesta` | Abre `/mi/citas/{citaId}` (la URL viene del backend y la valida `volverSeguro`). |

## Estructura

```text
src/shared/lib/propuestaCambioHora.ts     tipo, vigencia y cuenta regresiva (puro)
src/features/agenda/
  api.ts                                  disponibilidad + proponer
  hooks.ts                                useDisponibilidadCambioHora, useProponerCambioHora
  claves.ts                               clave ['barbero','citas',id,'disponibilidad',fecha]
  components/SheetProponerHora.tsx        selector día/hora y envío
  components/BloquePropuesta.tsx          estado "esperando respuesta" en las tarjetas
src/features/cuentas-cliente/
  api.ts                                  aceptar / rechazar
  hooks.ts                                mutaciones y sondeo con propuesta activa
  components/BannerPropuesta.tsx          banner del detalle
  domain/errores.ts                       mapearErrorCambioHora
  domain/citas.ts                         motivos cambio_hora_*
```

## Panel del barbero

- `SheetProponerHora` reutiliza `DiaSelector`, `SlotButton`, `generarDiasDisponibles`
  y `esSlotSeleccionable` de `features/reserva-publica`: la semántica
  verde/naranja/rojo y el rango hoy…hoy+7 son los mismos del backend.
- El día inicial es la fecha actual de la cita cuando está dentro de la ventana.
- Solo se puede enviar con un slot **verde** de la última consulta; si el slot
  elegido deja de estar libre, se avisa y hay que elegir otro.
- Al responder se muestra un toast («Propuesta enviada. El cliente tiene 1 hora
  para responder.») con acción **Avisar** cuando el backend devuelve
  `whatsappUrl`, y se invalidan todas las consultas del prefijo `barbero`.
- Con propuesta activa se muestra `BloquePropuesta` («Esperando respuesta ·
  expira en …») y se puede volver a proponer: la nueva reemplaza la anterior.
  El enlace «Avisar por WhatsApp» solo aparece cuando la respuesta trae
  `whatsappUrl` (el dashboard sí lo incluye; `GET /barbero/solicitudes` no,
  porque el backend responde sin contexto de barbería).

## App del cliente

- `BannerPropuesta` muestra la hora nueva, la anterior, la cuenta regresiva
  (`aria-live="polite"`) y las acciones con área táctil de botón de la app.
- Aceptar → toast «Cita confirmada en la nueva hora.»; Rechazar → «Tu solicitud
  quedó rechazada.» si venía `pendiente`, «Mantienes tu hora original.» si ya
  estaba `aceptada`. No hay confirmación intermedia.
- El detalle y el listado se refrescan por la mutación (`setQueryData` del
  detalle + invalidación de la lista). Un `404`/`409` también reintenta la
  lectura porque la propuesta ya no existe.
- El sondeo de 30 s (solo con la pestaña visible) corre cuando la cita está
  `pendiente` **o** tiene `propuestaCambioHora`, para que la propuesta
  desaparezca sola al vencer o al responderla en otro dispositivo.
- Si la cuenta regresiva local llega a cero se ocultan las acciones, se muestra
  «La propuesta expiró» y se hace **una** relectura (guard de 10 s). El
  vencimiento definitivo lo decide el backend.

## Push y service worker

- El push de cliente `cita_hora_propuesta` ya se reconoce por el prefijo `cita_`
  en `esPayloadCliente`; el clic navega al detalle y el mensaje `push-cliente`
  invalida las citas (`useInvalidarCitasPush`).
- Los push al barbero siguen siendo `{titulo, cuerpo, url}` (sin `tipo` ni
  `citaId`), así que nunca se confunden con los del cliente.
- `RUTAS_HEREDADAS` ahora traduce también `"/"` → `/app/solicitudes`: los avisos
  de resultado al barbero llegan con la raíz.

## Pruebas

- `src/shared/lib/propuestaCambioHora.test.ts` — vigencia, minutos restantes y
  texto.
- `src/features/agenda/domain/errores.test.ts` — 400/409 de «proponer».
- `src/features/cuentas-cliente/domain/citas.test.ts` — motivos
  `cambio_hora_*` y mensaje de estado.
- `src/features/notificaciones/domain/urlDestino.test.ts` — `"/"` y `/mi/citas/42`.
- `src/features/agenda/components/SheetProponerHora.test.tsx` — solo slots
  verdes, body del POST y toast con «Avisar».
- `src/features/cuentas-cliente/components/BannerPropuesta.test.tsx` — acciones,
  mensajes por estado y propuesta vencida.

## Lo que no se implementó

- Cancelar la propuesta desde el panel: no existe endpoint; se responde
  proponiendo otra o esperando la hora.
- Aceptar o rechazar desde las tarjetas del listado: solo desde el detalle.
- Recalcular la disponibilidad en tiempo real mientras el Sheet está abierto: se
  consulta al abrir y al cambiar de día (`staleTime` 20 s).
