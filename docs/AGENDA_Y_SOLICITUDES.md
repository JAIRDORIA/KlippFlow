# Agenda y Solicitudes — panel del barbero

Prompt 3 del frontend. Implementa las pantallas **Hoy** (`/app/hoy`) y
**Solicitudes** (`/app/solicitudes`) y todas sus acciones: aceptar, rechazar,
cancelar, no asistió, Atendido con propina, corrección de propina y el aviso por
WhatsApp.

Fuentes de verdad:

- `docs/backend/BARBERO_SOLICITUDES_Y_DASHBOARD.md` (dashboard, solicitudes y
  transiciones).
- `docs/backend/ATENCIONES_Y_PROPINAS.md` (Atendido y propina).
- `docs/DISENO.md` 6.3, 6.4, 6.5, 6.6 y 7.
- `PROJECT_CONTEXT.md` (convenciones).

No se inventó ningún campo de la API. Donde el diseño y el backend difieren,
manda el backend y la diferencia queda anotada en `docs/DISENO.md` §9.

---

## 1. Estructura

```text
src/features/agenda/
  types.ts                 DTOs tomados de docs/backend/
  api.ts                   GET dashboard + 5 transiciones + propina
  claves.ts                claves de TanStack Query
  hooks.ts                 useDashboardHoy y las mutaciones
  HoyPage.tsx              /app/hoy
  components/
    SheetClienteAtendido.tsx   Atendido y corrección de propina
    SheetCancelarCita.tsx      Cancelar cita
    SheetNoAsistio.tsx         Confirmación de no asistió
  domain/
    agenda.ts              duración, próxima cita, punto, contadores, detalles
    hoy.ts                 eyebrow + saludo de Hoy
    propina.ts             validación de propina y motivo
    errores.ts             mapa de errores por acción
    *.test.ts

src/features/solicitudes/
  api.ts                   GET /barbero/solicitudes
  hooks.ts                 useSolicitudes
  SolicitudesPage.tsx      /app/solicitudes
  components/
    SheetRechazarSolicitud.tsx
  domain/
    cuentaRegresiva.ts     cuenta regresiva viva
    fecha.ts               etiqueta Hoy / Mañana / sáb 31 oct
    *.test.ts
```

Además: `src/shared/lib/useAhora.ts` (reloj de interfaz) y
`src/shared/ui/EstadoError.tsx` (error de consulta con "Reintentar").

---

## 2. Claves de consulta y refresco

```ts
clavesConsulta = {
  dashboardHoy: ['barbero', 'dashboard', 'hoy'],
  solicitudes:  ['barbero', 'solicitudes'],
  balanceHoy:   ['barbero', 'balance', 'hoy'],   // reservada para Cuentas
}
```

- Todo cuelga del prefijo `['barbero']`: una sola invalidación refresca agenda,
  solicitudes y, cuando exista, el balance.
- **Sondeo de 60 s** con la pestaña visible: `refetchInterval` devuelve `false`
  si `document.visibilityState !== 'visible'`, y `refetchIntervalInBackground:
  false`. No hay sondeo en segundo plano.
- **Foco de ventana**: `refetchOnWindowFocus: true` (y `refetchOnReconnect`).
- **Cambio de pestaña**: `AppLayout` refresca `dashboardHoy` y `solicitudes`
  cuando cambia `pathname` (no en el montaje inicial).
- **Solicitudes siempre activa**: `useSolicitudes()` se monta en `AppLayout`, así
  que el badge del `BottomNav` está al día en las cinco pestañas. La pantalla de
  Solicitudes reutiliza la misma clave (una sola petición).
- **Push**: el puente ya existente en `src/sw.ts` envía
  `{ tipo: 'klippflow:refrescar' }` y `src/main.tsx` invalida las consultas
  montadas, lo que incluye dashboard y solicitudes. No se añadió nada nuevo.
- **Tras cada mutación**: se invalida todo `['barbero']` al terminar con éxito y
  también cuando el error es 409/404 (el estado cambió en el servidor).
- **Cuenta regresiva**: se recalcula cada 30 s con `useAhora(30_000)` y el
  `dataUpdatedAt` de la consulta, sin nuevas peticiones.

---

## 3. Pantalla Hoy (`/app/hoy`)

Cabecera: `eyebrowFecha(hoyBogota())` en mayúsculas y
`"{saludo}, {primer nombre}"`. Se recalculan cada 30 s, así que al pasar la
medianoche de Bogotá con la app abierta cambian solos.

Contadores (de `resumen`):

| Tarjeta | Campo | Nota |
|---|---|---|
| Por atender | `resumen.aceptadas` | Citas aceptadas del día. |
| Atendidos | `resumen.atendidas` | Sustituye al contador "Libres" del diseño. |
| Solicitudes | `resumen.solicitudesPendientes` | En ámbar y tocable → `/app/solicitudes`. |

> **Decisión de producto (2026-10-30):** `resumen` no expone ningún contador
> "Libres" y `huecosLibres` es un arreglo de rangos sin conteo ni minutos. El
> dueño pidió quitar ese contador y mostrar **Atendidos** en su lugar.

Agenda de hoy (línea de tiempo vertical, orden de la API por hora de inicio):

- Columna izquierda: `horaInicio` y duración (`formatearDuracion` en mono).
- Punto sobre la línea según `estadoVisualCita`:
  - `atendida`: punto gris relleno, tarjeta al 60 % y línea verde
    `Atendido` (+ `· propina $X` si `atencion.montoPropina` > 0). Esa línea es
    un botón que abre la corrección de propina.
  - `proxima`: primera `aceptada` por hora de inicio, con anillo hueso de 4 px
    al 20 % y borde hueso al 40 %.
  - `noAsistio`: tarjeta al 60 % con la etiqueta roja `No asistió`.
  - `futura`: punto vacío.
- Acompañantes: línea con ícono de personas y el detalle que entrega la API
  (`personas[].nombre` + `servicios[].nombre`). No hay edades en el contrato.
- `avisoDescanso`: bloque ámbar compacto con ícono de advertencia.
- Acciones de una cita `aceptada`: `Atendido` (principal compacto),
  `No asistió` (ghost, deshabilitado si `puedeMarcarNoAsistio !== true`, con
  texto accesible "Disponible desde la hora de inicio") y `X` para cancelar con
  `aria-label` que incluye el nombre del cliente.

Horarios libres: chips verdes con cada rango de `huecosLibres` y debajo
`Bloques: 09:00–13:00 · 15:00–19:00` en mono. Sin huecos:
"Hoy no tienes horarios libres"; sin bloques: "Hoy no tienes horario de
trabajo".

Estados: skeleton al cargar, `EstadoError` con "Reintentar" y vacío
"No tienes citas para hoy".

---

## 4. Pantalla Solicitudes (`/app/solicitudes`)

Eyebrow "ORDENADAS POR URGENCIA", título "Solicitudes" y el texto de las 2 horas.
El orden lo entrega la API (`expira_en` ascendente).

Cada tarjeta:

- `expira en N min` con ícono de reloj en ámbar (o `expirada` en rojo), y el
  monto a la derecha.
- Nombre y celular formateado en mono.
- Etiqueta de fecha (`Hoy` / `Mañana` / `sáb 31 oct`), hora de inicio en mono
  24 px, flecha y hora de fin, más los servicios.
- Si `numPersonas > 1`: "N personas" con el detalle de cada acompañante.
- Bloque ámbar con `avisoDescanso` cuando existe.
- `Rechazar` (ghost, abre el sheet) y `Aceptar` (principal, directo).

Cuando la cuenta regresiva llega a 0 la tarjeta se desactiva y se refresca la
lista (con un enfriamiento de 10 s para no entrar en bucle si el backend
todavía no refleja la expiración). Un 409 al aceptar muestra "Esta solicitud ya
expiró" o el mensaje de cruce de la API y refresca.

Vacío: "No tienes solicitudes pendientes". Skeleton al cargar y error con
"Reintentar".

Badge del `BottomNav`: cantidad de solicitudes; se oculta en 0 y muestra `9+`
por encima de 9.

---

## 5. Sheets

- **Cliente atendido** (registro): nombre, tarjeta "COBRA EN PERSONA" con el
  total en 36 px mono y "Total completo · {servicios}", `¿Dejó propina?` con
  `No / Sí`, campo numérico con teclado numérico, puntos de miles y atajos
  `$2.000`, `$5.000`, `$10.000`. "Confirmar cobro" se desactiva si "Sí" no tiene
  un monto válido. Nota: "Esta acción no se puede deshacer. La propina solo se
  corrige hoy."
- **Cliente atendido** (corrección): mismo sheet con la propina actual
  precargada; elegir "No" envía `0` y la quita. El 409 del backend se muestra
  dentro del sheet y no se cambia nada.
- **Rechazar solicitud**: cliente y hora, tarjetas "Horario ocupado"
  (`horario_ocupado`) y "No disponible" (`no_disponible`), botón danger
  desactivado hasta elegir y ghost "Volver".
- **Cancelar cita**: cliente y hora, "Motivo (opcional)" con contador de 255,
  botón danger y ghost "Volver".
- **¿Marcar como no asistió?**: confirmación con aviso de que no se puede
  deshacer.

Todos usan el `Sheet` del kit: overlay, Esc, toque fuera, scroll bloqueado,
foco atrapado y retorno del foco al botón que lo abrió. Los `onCerrar` son
estables (`useCallback`) para que un refetch no robe el foco mientras se escribe.

---

## 6. Toast y "Avisar"

- Aceptar, rechazar, cancelar y no-asistió muestran el resultado en un toast de
  **8 s**. Si la respuesta trae `whatsappUrl`, el toast muestra "Avisar" como un
  `<a target="_blank" rel="noopener noreferrer">` real (no `window.open`).
- No-asistió no devuelve `whatsappUrl` según el backend, así que su toast no
  muestra "Avisar".
- Atendido y corrección de propina muestran su propio toast sin "Avisar".
- Los errores de sheet se pintan dentro del sheet; los de acciones directas
  (Aceptar) van al toast.

---

## 7. Mapa de errores por acción

Implementado en `src/features/agenda/domain/errores.ts`.

| Código | Mensaje que ve el barbero | Refresca |
|---|---|---|
| red (0) | "No pudimos conectar. Revisa tu internet." | No |
| 400 | Mensaje de la API (o `campos[0]`) | No |
| 401 | "Tu sesión expiró. Vuelve a iniciar sesión." (el cliente ya redirige) | No |
| 403 | Mensaje de la API o "No tienes permiso para esta acción." | No |
| 404 | Mensaje de la API (`Cita no encontrada`, `Atención no encontrada`) | Sí |
| 409 aceptar/rechazar con "expir" | "Esta solicitud ya expiró" | Sí |
| 409 cruce / ya respondida / cancelar / no asistió / propina | Mensaje de la API | Sí |
| 429 | "Demasiados intentos, espera un momento." | No |
| 5xx | "Algo salió mal. Inténtalo de nuevo." | Sí |

---

## 8. Reglas de propina

| Caso | Regla |
|---|---|
| Al marcar Atendido | Entero 1–1.000.000. `0` no es válido y no se puede enviar. |
| Al corregir | Mismo rango, pero `0` es válido y quita la propina. |
| Decimales / texto / signos | Se rechazan en el cliente con un mensaje legible. |
| Día permitido | Solo el mismo día del balance (`atenciones.fecha_balance`). Después → 409 con el mensaje de la API. |
| Efecto en el balance | El backend aplica `delta = nuevo − anterior`. |
| Cómo se sabe en la agenda | `cita.atencion.montoPropina` (null o 0 = sin propina). |
| ¿Se puede corregir desde Hoy? | Sí: el dashboard solo lista citas de hoy, y una cita de hoy solo pudo atenderse hoy. Si el backend la rechaza, se muestra su 409. |

---

## 9. Lo que no se implementó

- Cuentas, Compras, Ajustes y onboarding de instalación.
- Flujo real de notificaciones push (suscripción, permiso, prueba, baja): solo se
  aprovecha el puente de refresco que ya existía en el service worker.

---

## 10. Pruebas manuales

Backend en `http://localhost:3000`, frontend en `http://localhost:3001`, barbero
de pruebas `barbero1` / código `BARB-0001` (`barbero_id = 1`).

### 10.1 SELECT "antes" del balance

Ejecuta esto **antes de tocar nada** y guarda el resultado:

```sql
-- Hoy en Bogotá, sin depender de la zona del servidor de BD.
SET @hoy := DATE(UTC_TIMESTAMP() - INTERVAL 5 HOUR);
SET @barbero := 1;

SELECT barbero_id, fecha, total_anticipos, total_servicios, total_propinas,
       total_devoluciones, total_compras, ganancia_neta
  FROM balance_resumen_diario
 WHERE barbero_id = @barbero AND fecha = @hoy;
```

- Si devuelve una fila, anota los seis totales: son los valores a restaurar.
- Si no devuelve nada, la prueba creará la fila y al final hay que borrarla.

### 10.2 Preparar los casos que la app no permite

Los datos se crean **por la API pública** (así `cita_personas` y
`cita_persona_servicios` quedan bien) y luego se ajustan con SQL usando solo
columnas documentadas.

```bash
# (3) cita que después se marcará atendida con propina y se moverá a otro día
curl -s -X POST http://localhost:3000/public/barberos/BARB-0001/citas \
  -H "Content-Type: application/json" -d '{
    "nombre": "TEST-PROPINA-OTRODIA",
    "celular": "3001110201",
    "fecha": "2026-10-30",
    "horaInicio": "09:00",
    "personas": [{ "servicioIds": [1] }]
  }'

# (4) cita con acompañantes
curl -s -X POST http://localhost:3000/public/barberos/BARB-0001/citas \
  -H "Content-Type: application/json" -d '{
    "nombre": "TEST-ACOMPANANTE",
    "celular": "3001110202",
    "fecha": "2026-10-30",
    "horaInicio": "15:00",
    "personas": [{ "servicioIds": [1] }, { "servicioIds": [1], "nombre": "TEST-Hijo" }]
  }'
```

Ajustes por SQL (columnas documentadas en `BARBERO_SOLICITUDES_Y_DASHBOARD.md`
y `ATENCIONES_Y_PROPINAS.md`):

```sql
SET @hoy := DATE(UTC_TIMESTAMP() - INTERVAL 5 HOUR);
SET @barbero := 1;

-- (1) solicitud pendiente que expira en 2 minutos
UPDATE citas
   SET estado = 'pendiente',
       expira_en = NOW() + INTERVAL 2 MINUTE,
       respondido_en = NULL,
       cerrada_en = NULL
 WHERE barbero_id = @barbero
   AND invitado_nombre LIKE 'TEST-EXPIRA%';

-- (2) cita aceptada de hoy cuya hora de inicio ya pasó (para "No asistió")
UPDATE citas
   SET fecha = @hoy,
       hora_inicio = '08:00:00',
       hora_fin = '08:30:00',
       estado = 'aceptada',
       expira_en = NOW() + INTERVAL 2 HOUR,
       respondido_en = NOW()
 WHERE barbero_id = @barbero
   AND invitado_nombre = 'TEST-NOASISTIO';

-- (3) mover el día del balance de la atención a ayer
--     (mismo UPDATE que documenta ATENCIONES_Y_PROPINAS.md §216-221).
--     Hazlo DESPUÉS de marcarla "Atendido" con propina desde la app.
UPDATE atenciones a
  JOIN citas c ON c.id = a.cita_id
   SET a.fecha_balance = DATE_SUB(a.fecha_balance, INTERVAL 1 DAY)
 WHERE c.barbero_id = @barbero
   AND c.invitado_nombre = 'TEST-PROPINA-OTRODIA';
```

> **Por qué (3) se hace así:** la corrección de propina se valida contra
> `atenciones.fecha_balance`, no contra `citas.fecha`. El dashboard solo lista
> las citas de **hoy**, así que para poder pulsar la línea "Atendido · propina"
> la cita debe seguir siendo de hoy y lo que se mueve a ayer es el día del
> balance. Si además quieres probar una cita realmente de ayer, cámbiale
> `citas.fecha` y llama `PUT /barbero/citas/:id/propina` por `curl`: esa cita no
> aparecerá en Hoy por diseño del backend.

### 10.3 Limpieza

```sql
SET @hoy := DATE(UTC_TIMESTAMP() - INTERVAL 5 HOUR);
SET @barbero := 1;

-- Paso 1: ver qué se va a borrar
SELECT id, invitado_nombre, estado, fecha, hora_inicio, monto_total
  FROM citas
 WHERE barbero_id = @barbero AND invitado_nombre LIKE 'TEST-%';

-- Paso 2: ver los movimientos de dinero que quitarán esas citas
SELECT a.cita_id, c.invitado_nombre, a.fecha_balance, a.saldo_cobrado, a.monto_propina
  FROM atenciones a
  JOIN citas c ON c.id = a.cita_id
 WHERE c.barbero_id = @barbero AND c.invitado_nombre LIKE 'TEST-%';

-- Paso 3: borrar las citas TEST (cascada a personas, servicios y atenciones)
DELETE FROM citas
 WHERE barbero_id = @barbero AND invitado_nombre LIKE 'TEST-%';

-- Paso 4a: si el SELECT "antes" trajo una fila, restaurarla EXACTAMENTE
UPDATE balance_resumen_diario
   SET total_anticipos    = <antes.total_anticipos>,
       total_servicios    = <antes.total_servicios>,
       total_propinas     = <antes.total_propinas>,
       total_devoluciones = <antes.total_devoluciones>,
       total_compras      = <antes.total_compras>,
       ganancia_neta      = <antes.ganancia_neta>
 WHERE barbero_id = @barbero AND fecha = @hoy;

-- Paso 4b: si el SELECT "antes" NO trajo fila, bórrala
DELETE FROM balance_resumen_diario
 WHERE barbero_id = @barbero AND fecha = @hoy;

-- Paso 5: comprobar que quedó igual que "antes"
SELECT barbero_id, fecha, total_anticipos, total_servicios, total_propinas,
       total_devoluciones, total_compras, ganancia_neta
  FROM balance_resumen_diario
 WHERE barbero_id = @barbero AND fecha = @hoy;
```

El `DELETE` de citas no revierte el balance: por eso el paso 4 es obligatorio.

### 10.4 Guion de pruebas

| # | Qué hacer | Qué debes ver |
|---|---|---|
| a | `pnpm lint`, `pnpm test`, `pnpm build` | 0 errores, 171 pruebas en verde. |
| b | Crear 3 solicitudes TEST desde `/b/BARB-0001` (una con acompañante y una que invada el cierre de un bloque) y abrir `/app/solicitudes`. | Ordenadas por urgencia, con fecha, hora, servicios, personas y cuenta regresiva. La que invade el bloque muestra el aviso ámbar. |
| c | Aceptar una. | Toast "Solicitud aceptada." con "Avisar"; el enlace abre `wa.me` con el mensaje prellenado. Aparece en Hoy y bajan el contador y el badge. |
| d | Rechazar otra con cada motivo. | El botón danger está desactivado hasta elegir. Tras rechazar, el horario se ve libre en la página pública. |
| e | Cambiar de pestaña y crear una solicitud desde otra ventana. | El badge es correcto en todas las pestañas y aparece en menos de 60 s o al volver a la app. |
| f | Aplicar el SQL (1) y pulsar Aceptar justo al vencer. | La cuenta regresiva baja; al vencer muestra "Esta solicitud ya expiró" y la lista se refresca. |
| g | Mirar Hoy. | Contadores (Por atender / Atendidos / Solicitudes), línea de tiempo ordenada, anillo en la próxima cita, chips de horarios libres y línea de bloques. |
| h | Atendido sin propina. | La tarjeta pasa a atendida y el balance del día sube exactamente el total. |
| i | Atendido con $5.000 → editar a $8.000 → quitar (0). | "Atendido · propina $5.000", luego $8.000, luego sin propina. Los valores inválidos (0 al crear, 1.000.001, decimales, texto) no se pueden enviar. |
| j | Aplicar el SQL (3) y corregir la propina desde la línea "Atendido". | Se muestra el mensaje de la API (solo el mismo día) y no cambia nada. |
| k | Con el SQL (2): antes de la hora y después. | "No asistió" desactivado antes de la hora de inicio; activo después. Al confirmar, la tarjeta queda marcada. |
| l | Cancelar con y sin motivo. | Toast "Cita cancelada." con "Avisar"; el horario queda libre en la página pública. |
| m | Doble clic rápido en Aceptar y en Atendido; luego dos ventanas a la vez. | Una sola petición por acción; la segunda ventana muestra el mensaje del 409 sin romperse. |
| n | Apagar el backend, recargar y encenderlo. | Hoy y Solicitudes muestran el error con "Reintentar" y se recuperan. Una acción fallida por red deja el sheet abierto con el mensaje. |
| o | Borrar el token o esperar el 401. | La app lleva a `/login`. |
| p | Entrar como barbero2. | No ve citas de barbero1; una acción sobre un id ajeno responde 404 ("Cita no encontrada"). |
| q | Revisar a 390 px y navegar con teclado. | Sin scroll horizontal, objetivos táctiles de 40 px o más, sheets con foco atrapado, Esc y retorno del foco. |
| r | `git status`. | Sin `.env`, `node_modules` ni `dist`; ningún hexadecimal fuera de `tokens.css`. |
