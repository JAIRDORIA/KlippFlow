# Reserva pública y seguimiento

Última actualización: **2026-10-30** (Prompt 2 del frontend).

Implementación de la reserva sin cuenta para clientes y del seguimiento por token.
Fuente de contrato: `docs/backend/PUBLICO_INFO_Y_DISPONIBILIDAD.md` y
`docs/backend/PUBLICO_CREAR_CITA.md`. Si hay conflicto con `DISENO.md`, manda el
backend.

## Rutas

| Ruta | Uso |
|---|---|
| `/b` | Pide el código del barbero. No consulta la API. |
| `/b/:codigo` | Reserva: servicios, personas, fecha/hora y datos. |
| `/cita/:token` | Seguimiento y confirmación de la cita. |

No hay login de cliente ni botón de volver. El botón “Cerrar” del seguimiento
lleva a `/b/{codigo}` si el código está en el navegador; si no, a `/b`.

## Flujo

1. `/b` normaliza el código a mayúsculas, sin espacios y navega a `/b/{codigo}`.
2. `/b/:codigo` hace `GET /public/barberos/:codigo`.
   - 404 o formato inválido → “No encontramos esta barbería”.
   - `reservasDisponibles: false` → aviso “Las reservas no están disponibles por
     ahora.” y no muestra formulario.
3. El formulario construye la reserva:
   - selección múltiple de servicios del titular;
   - modo solo o con acompañantes;
   - cada acompañante puede elegir varios servicios (1–10, decisión de producto);
   - máximo 4 personas contando al titular;
   - día del horizonte y hora libre;
   - nombre, celular y correo opcional.
4. Al enviar hace `POST /public/barberos/:codigo/citas` con el cuerpo documentado.
5. En éxito guarda `{ token, codigo, creadoEn }` y navega a `/cita/{token}`.
6. El seguimiento hace `GET /public/citas/:token`; mientras esté `pendiente`
   repite cada 30 s solo con la pestaña visible.

## Reglas del backend aplicadas

### Horizonte y disponibilidad

- Horizonte: desde **hoy hasta hoy + 7 días**, ambos incluidos. El selector genera
  **8 fechas** desde `hoyBogota()`.
- Para hoy, la API omite los inicios anteriores a `ahora + 30 min` redondeado a
  15 minutos. No se les asigna un estado visual porque no se devuelven.
- `slots` se consulta solo para la fecha seleccionada.
- `verde` → libre y seleccionable; `naranja` → por confirmar, desactivado;
  `rojo` → ocupado, tachado y desactivado.
- Solo se puede seleccionar un horario libre. Si la hora guardada deja de estar
  libre tras una recarga, se descarta.
- El selector de días no hace peticiones por cada día.

### Personas y servicios

- La primera persona de `personas` es el titular.
- La API acepta de 1 a 4 personas y de 1 a 10 `servicioIds` únicos por persona.
- La UI permite selección múltiple en el titular y en cada acompañante.
- Un acompañante sin ningún servicio impide solicitar la cita.
- El total de duración debe quedar entre 5 y 600 minutos, divisible por 5.
- El frontend no envía precios ni duraciones: solo `servicioIds`. El backend
  calcula ambos y tampoco recibe `barberoId` ni `vaSolo`.

### Celular y correo

- Celular: se aceptan dígitos, espacios, guiones y un `+` inicial. Se elimina
  todo lo que no sea dígito; si quedan 12 y empieza por `57`, se quita el
  prefijo. Debe quedar `^3\d{9}$`.
- Se envía normalizado a 10 dígitos: `+57 300 123 4567` → `3001234567`.
- Correo: opcional. Vacío es válido; si se escribe debe tener formato básico de
  email. Se omite del cuerpo si está vacío.

### Cuerpo del POST

```json
{
  "nombre": "Juan Pérez",
  "celular": "3001234567",
  "correo": "juan@example.com",
  "fecha": "2026-10-30",
  "horaInicio": "09:00",
  "personas": [
    { "servicioIds": [1, 2] },
    { "servicioIds": [2, 3] }
  ]
}
```

`correo` se omite cuando está vacío. Los acompañantes no envían nombre porque la
UI no lo pide; el contrato solo exige `servicioIds` por persona.

## Hooks y consultas

Archivo: `src/features/reserva-publica/hooks.ts`.

| Hook | Query key | Comportamiento |
|---|---|---|
| `useBarberoPublico(codigo)` | `['publico','barbero',codigo]` | `staleTime` 60 s; sin reintento en 4xx. |
| `useDisponibilidad(codigo,fecha,duracion)` | `['publico','disponibilidad',codigo,fecha,duracion]` | Habilitado solo con duración válida; `staleTime` 20 s; sin refetch al enfocar. |
| `useCrearCita(codigo)` | mutación | Sin reintento automático; evita doble envío desde la UI. |
| `useSeguimiento(token)` | `['publico','seguimiento',token]` | Polling 30 s solo si `estado === 'pendiente'` y `document.visibilityState === 'visible'`; se detiene en estados finales. |

La consulta de disponibilidad se retrasa 400 ms con `useDebouncedValue` para
agrupar cambios de servicios, acompañantes o día. El límite documentado es 30
peticiones por minuto por IP.

## Almacenamiento del cliente

Clave: **`klippflow.citasCliente`**.

```ts
interface CitaGuardada {
  token: string
  codigo: string
  creadoEn: string
}
```

- Lista con máximo **5** citas, la más reciente primero.
- Sin tokens duplicados.
- Tolera `localStorage` bloqueado o lleno, JSON corrupto y entradas inválidas.
- No guarda nombre, celular, correo, servicios ni precios.
- “Cita activa de un código” es la cita guardada más reciente de ese código. El
  registro local no guarda el estado; el estado real se consulta en
  `/cita/:token`.

## Estados del seguimiento

El texto principal es siempre `mensaje` de la API. El título, ícono y color son
presentación:

| Estado | Ícono | Color | Título |
|---|---|---|---|
| `pendiente` | reloj | ámbar | Cita creada |
| `aceptada` | check | verde | Cita confirmada |
| `rechazada` | cruz | rojo | Solicitud rechazada |
| `cancelada` | cruz | rojo | Cita cancelada |
| `expirada` | reloj | gris | La solicitud expiró |
| `atendida` | check | verde | Gracias por venir |
| `no_asistio` | usuario con x | gris | Cita no asistida |

- `pendiente` muestra además “Tiene hasta 2 horas para responder”.
- `rechazada` muestra `motivoRechazo` (`horario_ocupado` o `no_disponible`).
- `cancelada` muestra `motivoCancelacion` si existe.
- La API devuelve `expirada` de forma efectiva cuando `expira_en <= NOW()`.
- No se muestra la fila “Servicios”: `GET /public/citas/:token` no devuelve los
  servicios ni el POST los devuelve. Sí se muestran Fecha, Hora y Total.

## Mapa de errores

### Crear cita

| Caso | Mensaje/acción |
|---|---|
| 400 | Mensaje de la API (`message` o `message[]`); no se inventan campos. |
| 404 | “No encontramos esta barbería.” |
| 409 horario | “Ese horario ya no está disponible. Elige otro.” + se descarta la hora y se recarga la disponibilidad. |
| 409 celular pendiente | “Ya tienes una solicitud pendiente con este celular. Espera la respuesta del barbero.” |
| 409 barbero no activo | Mensaje de la API o “Las reservas no están disponibles por ahora.” |
| 429 | “Demasiados intentos. Intenta de nuevo en unos minutos.” |
| Red (`status: 0`) | “No pudimos conectar. Revisa tu internet.” |
| 5xx | “Algo salió mal. Inténtalo de nuevo.” |

La detección de los dos 409 se hace por el mensaje documentado de la API.

### Consultas

- Barbero 404 → “No encontramos esta barbería”.
- Seguimiento 404 → “No encontramos esta cita”.
- Error de disponibilidad → “No pudimos cargar los horarios” con “Reintentar”.
- Error de barbero o seguimiento → estado de error con “Reintentar”.
- 429 de disponibilidad → mismo estado de error reintentable.

## Privacidad y accesibilidad

- No se muestran celular, correo ni nombre del cliente en el seguimiento; la API
  tampoco los devuelve.
- La URL solo contiene `codigo` o `token`; no datos personales.
- No hay `dangerouslySetInnerHTML`: todos los textos de usuario se renderizan
  como texto.
- `index.html` incluye `robots: noindex, nofollow`.
- Horarios y días son botones con `aria-pressed`; los no seleccionables llevan
  `aria-disabled="true"`.
- Objetivos táctiles de 40 px o más y foco visible global.
- Sin scroll horizontal a 360 px y 390 px.

## SQL de datos de prueba (ejecutar a mano)

**No ejecutar los INSERT sin correr primero los SELECT.** Si aparece cualquier
servicio u horario real para `barbero1`, detenerse y confirmar antes de continuar.

### 1. Comprobación previa

```sql
SELECT id, username, codigo_unico, estado_cuenta
FROM barberos
WHERE username = 'barbero1';

SELECT id, nombre, descripcion, precio, duracion_minutos, activo
FROM servicios
WHERE barbero_id = (SELECT id FROM barberos WHERE username = 'barbero1');

SELECT id, dia_semana, hora_inicio, hora_fin, activo
FROM horarios_trabajo
WHERE barbero_id = (SELECT id FROM barberos WHERE username = 'barbero1');
```

Si los dos últimos SELECT devuelven **cero filas**, se pueden crear los datos
TEST. Si devuelven filas, no ejecutar los INSERT y pedir confirmación.

### 2. Servicios de prueba

```sql
INSERT INTO servicios
  (barbero_id, nombre, descripcion, precio, duracion_minutos, activo)
SELECT id, 'TEST-Corte', 'Corte de prueba', 30000, 45, 1
FROM barberos WHERE username = 'barbero1';

INSERT INTO servicios
  (barbero_id, nombre, descripcion, precio, duracion_minutos, activo)
SELECT id, 'TEST-Barba', 'Barba de prueba', 18000, 30, 1
FROM barberos WHERE username = 'barbero1';

INSERT INTO servicios
  (barbero_id, nombre, descripcion, precio, duracion_minutos, activo)
SELECT id, 'TEST-Cejas', 'Cejas de prueba', 10000, 15, 1
FROM barberos WHERE username = 'barbero1';
```

### 3. Horarios de prueba para los próximos días

`horarios_trabajo` es semanal (`dia_semana`: 0 = domingo). Estos siete bloques
cubren los próximos 7 días:

```sql
INSERT INTO horarios_trabajo
  (barbero_id, dia_semana, hora_inicio, hora_fin, activo)
SELECT b.id, d.dia, '08:00:00', '20:00:00', 1
FROM barberos b
JOIN (
  SELECT 0 AS dia UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL
  SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) d
WHERE b.username = 'barbero1';
```

### 4. Limpieza

```sql
DELETE FROM citas
WHERE invitado_nombre LIKE 'TEST-%';

DELETE FROM servicios
WHERE nombre LIKE 'TEST-%'
  AND barbero_id = (SELECT id FROM barberos WHERE username = 'barbero1');

DELETE FROM horarios_trabajo
WHERE barbero_id = (SELECT id FROM barberos WHERE username = 'barbero1')
  AND dia_semana BETWEEN 0 AND 6
  AND hora_inicio = '08:00:00'
  AND hora_fin = '20:00:00';
```

Las personas y sus servicios se eliminan en cascada con la cita.

## SQL para probar estados

Usar el nombre real de la cita TEST creada:

```sql
-- Pendiente → aceptada (para verificar el polling de 30 s)
UPDATE citas
SET estado = 'aceptada', respondido_en = NOW(), cerrada_en = NOW()
WHERE invitado_nombre = 'TEST-Reserva';

-- Rechazada con motivo
UPDATE citas
SET estado = 'rechazada',
    motivo_rechazo = 'horario_ocupado',
    respondido_en = NOW(),
    cerrada_en = NOW()
WHERE invitado_nombre = 'TEST-Reserva';

-- Cancelada
UPDATE citas
SET estado = 'cancelada',
    motivo_cancelacion = 'Cambio de agenda del barbero',
    cerrada_en = NOW()
WHERE invitado_nombre = 'TEST-Reserva';

-- Expirada efectiva sin esperar al job
UPDATE citas
SET expira_en = DATE_SUB(NOW(), INTERVAL 1 MINUTE)
WHERE invitado_nombre = 'TEST-Reserva';

-- Atendida / no asistió
UPDATE citas SET estado = 'atendida' WHERE invitado_nombre = 'TEST-Reserva';
UPDATE citas SET estado = 'no_asistio' WHERE invitado_nombre = 'TEST-Reserva';
```

Para la prueba de polling: dejar la cita `pendiente`, abrir el seguimiento,
ejecutar el UPDATE a `aceptada` y esperar hasta 30 s sin recargar.
