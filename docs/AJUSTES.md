# Ajustes — link público, servicios, horarios y cerrar sesión

Prompt 5 del frontend. Implementa la pantalla **Ajustes** (`/app/ajustes`).

Fuentes de verdad:

- `docs/backend/SERVICIOS.md`
- `docs/backend/HORARIOS_Y_CONFIGURACION.md`
- `docs/DISENO.md` 6.9 y 4
- `PROJECT_CONTEXT.md`

No se inventó ningún campo. Donde el diseño y el backend difieren, manda el
backend y la diferencia queda anotada en `docs/DISENO.md` §9.

---

## 1. Estructura

```text
src/features/ajustes/
  types.ts                  Configuracion, Servicio, Horario y cuerpos
  api.ts                    /barbero/configuracion, /servicios y /horarios
  claves.ts                 claves de consulta
  hooks.ts                  useConfiguracion, useServicios, useHorarios,
                            mutaciones de servicios y useGuardarDiaHorario
  AjustesPage.tsx           /app/ajustes
  components/
    TarjetaLink.tsx         link público + Copiar + Ver como cliente
    BotonEnlace.tsx         <a> con la apariencia del botón ghost
    SeccionServicios.tsx    lista con activos e inactivos
    SheetServicio.tsx       nuevo / editar / desactivar / reactivar
    SeccionHorarios.tsx     las 7 filas
    FilaDia.tsx             interruptor, bloques y guardado por día
  domain/
    horas.ts                formatos 12/24 h, bloques, solapes
    servicios.ts            validación y presentación
    horarios.ts             filas, borradores, validación y plan de guardado
    errores.ts              mapa de errores
    portapapeles.ts         copiar con respaldo
    *.test.ts
```

---

## 2. Claves de consulta e invalidación

```ts
clavesAjustes.configuracion = ['barbero', 'configuracion']
clavesAjustes.servicios    = ['barbero', 'servicios', 'todos']
clavesAjustes.horarios     = ['barbero', 'horarios']
```

| Mutación | Invalida |
|---|---|
| Crear / editar / desactivar / reactivar servicio | `servicios` |
| Guardar un día de horarios | `horarios` **y** `['barbero','dashboard','hoy']` |

- El dashboard se invalida porque `bloquesDeTrabajo` y `huecosLibres` salen de
  los bloques activos del día.
- La disponibilidad pública (`['publico', …]`) vive en otra pestaña/contexto y
  no comparte caché: al abrir `/b/{codigo}` siempre se pide de nuevo. No se
  invalida desde el panel.
- Todo cuelga de `['barbero']`, así que el refresco al cambiar de pestaña de
  `AppLayout` también las cubre.
- Una mutación de servicio no toca el dashboard: los servicios no cambian la
  agenda ya creada.

---

## 3. Decisión del paso 0.4: el interruptor de "día activado"

El backend **no** tiene un booleano por día: `horarios_trabajo` son bloques con
`dia_semana`, `hora_inicio`, `hora_fin` y `activo`. La solución más simple y sin
campos nuevos es:

| Concepto de la UI | Modelo del backend |
|---|---|
| Día activado | al menos un bloque del día con `activo: true` |
| Apagar el día | `PATCH { activo: false }` a cada bloque activo (se conservan las horas) |
| Encender un día sin bloques | `POST { diaSemana, horaInicio: '09:00', horaFin: '13:00' }` |
| Encender un día con bloques | `PATCH { activo: true }` a los bloques existentes |
| Agregar bloque | `POST` con el día y las horas |
| Quitar bloque | `DELETE` (borrado físico documentado) |
| Cambiar horas | `PATCH { horaInicio, horaFin }` |

Consecuencias:

- El interruptor es un estado del **borrador**: no se guarda hasta pulsar
  "Guardar" (el prompt pide guardado explícito, no autoguardado).
- Apagar un día con bloques deja el día con bloques inactivos: la fila sigue
  mostrando las horas atenuadas y el backend deja de ofrecerlas.
- Si el backend devolviera un día con bloques mezclados (algunos activos y otros
  no, algo que esta UI no produce), el día se muestra como activado y el
  siguiente guardado reactiva los inactivos.
- Un `PATCH` que reactiva un bloque se valida en el backend contra los demás
  bloques activos del mismo día: si se cruzaran, responde 409 y el mensaje se
  muestra en la fila de ese día.

### Guardado por día

`planificarGuardado(dia, servidor)` (función pura, con pruebas) traduce el
borrador a operaciones concretas y se ejecutan en orden:

1. `DELETE` de los bloques que ya no están.
2. Si el día quedó apagado: `PATCH { activo: false }` a los que sigan activos.
3. Si el día está encendido y no tiene bloques: `POST` 09:00–13:00.
4. Si el día está encendido: `POST` de los nuevos y `PATCH` de las horas
   cambiadas o de los bloques inactivos que se reactivan.

El primer error detiene la secuencia, se muestra en la fila y **no se pierde lo
escrito**. Al fallar se invalida `horarios` para que "Descartar" parta de un
estado coherente con el servidor.

### Validación local antes de enviar

- Cada hora debe ser `HH:mm` de 24 h con minutos 00/15/30/45 (el backend lo
  exige).
- `horaFin > horaInicio`.
- Los bloques de un mismo día no se pueden cruzar. Que uno termine justo cuando
  empieza el otro **sí** está permitido (el backend no lo considera solape).
- Se aceptan varios bloques por día.
- Encender un día sin bloques crea el bloque 09:00–13:00 del diseño.

### Selector de hora

Se usa `<input type="time" step="900">`: en iPhone abre el selector nativo y
devuelve `HH:mm` de 24 h. Debajo de cada bloque se muestra el rango en 12 h
(`09:00 a. m. – 01:00 p. m.`) con `horaA12`, como pide `DISENO.md` 4.

---

## 4. Link público

- `GET /barbero/configuracion` devuelve `{ codigoUnico, linkReservas }` y el link
  **ya viene completo** (`APP_PUBLIC_URL/b/{codigoUnico}`). Se muestra tal cual.
- El `codigoUnico` **no se muestra** como dato aparte: solo se usa para el
  `href` de "Ver como cliente".
- "Copiar" usa `navigator.clipboard.writeText` y, si no está disponible o falla,
  un textarea temporal con `document.execCommand('copy')`. Toast "Link copiado"
  o un aviso para copiarlo a mano.
- "Ver como cliente" es un `<a target="_blank" rel="noopener noreferrer">` real
  a `/b/{codigoUnico}`.

---

## 5. Servicios

Límites exactos de `docs/backend/SERVICIOS.md`:

| Campo | Regla |
|---|---|
| `nombre` | obligatorio, 2–100 caracteres |
| `descripcion` | opcional, máximo 500 |
| `precio` | entero, mínimo 1 (no hay máximo documentado) |
| `duracionMinutos` | entero 5–480, múltiplo de 5; por defecto 30 |
| `activo` | no se envía al crear (nace `true`); `PATCH` lo acepta |

- La lista pide `GET /barbero/servicios?incluirInactivos=true` y muestra los
  activos primero y los inactivos al final, atenuados y con la etiqueta
  "Inactivo".
- "Desactivar" es `PATCH { activo: false }` (borrado lógico): el servicio deja de
  ofrecerse, pero las citas ya creadas no cambian.
- "Reactivar" es `PATCH { activo: true }`.
- "Guardar" se desactiva si el formulario es inválido o si no hay cambios.
- Editar envía `nombre`, `precio`, `duracionMinutos` y `descripcion` (cadena
  vacía para borrarla); crear omite `descripcion` si está vacía.
- El precio usa `MoneyInput`, así que interpreta `$25.000`, `25.000` y `25000`
  igual y rechaza decimales, negativos y letras.

---

## 6. Cerrar sesión

Confirmación simple en un sheet. Al confirmar:

1. `cerrarSesion()` del `AuthProvider` (ejecuta las tareas registradas con
   `registrarAntesDeCerrarSesion` y borra `klippflow.barbero.sesion`).
2. `queryClient.clear()` para que no quede ningún dato del barbero anterior.
3. `navigate('/login', { replace: true })`; además `ProtectedRoute` redirige solo
   al quedar sin sesión.

Así, al entrar con otro barbero no hay datos ni link del anterior.

---

## 7. Mapa de errores

`src/features/ajustes/domain/errores.ts`.

| Código | Mensaje | Refresca |
|---|---|---|
| red (0) | "No pudimos conectar. Revisa tu internet." | No |
| 400 | Mensaje de la API (o `campos[0]`) | No |
| 401 | "Tu sesión expiró. Vuelve a iniciar sesión." (el cliente redirige) | No |
| 403 | Mensaje de la API o "No tienes permiso para esta acción." | No |
| 404 | `Servicio no encontrado` / `Horario no encontrado` | Sí |
| 409 | Mensaje de la API o `El horario se cruza con otro bloque de ese día` | Sí |
| 429 | "Demasiados intentos, espera un momento." | No |
| 5xx | "Algo salió mal. Inténtalo de nuevo." | Sí |

Los errores de campo (400) se muestran bajo el campo con `role="alert"` y
`aria-describedby`; los de la fila de un día se muestran en esa fila.

---

## 8. Lo que NO se implementó

- Onboarding de instalación (`/instalar` sigue como marcador).
- Notificaciones push (activar, enviar prueba, baja al cerrar sesión). El hook
  `registrarAntesDeCerrarSesion` existe y está listo, pero este prompt no
  registra ninguna tarea.
- Panel de administración.
- Cambio de contraseña.
- Anticipos, pagos y devoluciones (Fase 2).

---

## 9. Pruebas manuales

Backend en `http://localhost:3000`, frontend en `http://localhost:3001`,
barbero de pruebas `barbero1` / `BARB-0001` (`barbero_id = 1`).

### 9.1 SELECT "antes" (guardar antes de tocar nada)

```sql
SET @barbero := 1;

SELECT id, nombre, descripcion, precio, duracion_minutos, activo
  FROM servicios
 WHERE barbero_id = @barbero
 ORDER BY nombre;

SELECT id, dia_semana, hora_inicio, hora_fin, activo
  FROM horarios_trabajo
 WHERE barbero_id = @barbero
 ORDER BY dia_semana, hora_inicio;
```

Anota las filas de servicios y de horarios (con `activo`).

### 9.2 Limpieza

```sql
SET @barbero := 1;

-- 1) Ver qué servicios TEST- se van a borrar
SELECT id, nombre, precio, duracion_minutos, activo
  FROM servicios
 WHERE barbero_id = @barbero AND nombre LIKE 'TEST-%';

-- 2) Borrar los servicios de prueba.
--    Si falla por la FK RESTRICT de cita_persona_servicios (el servicio tiene
--    citas asociadas), NO lo borres: desactívalo.
DELETE FROM servicios
 WHERE barbero_id = @barbero AND nombre LIKE 'TEST-%';

-- 2-bis) Alternativa cuando el DELETE falla por citas asociadas
UPDATE servicios SET activo = 0
 WHERE barbero_id = @barbero AND nombre LIKE 'TEST-%';

-- 3) Ver el estado actual de horarios antes de restaurar
SELECT id, dia_semana, hora_inicio, hora_fin, activo
  FROM horarios_trabajo
 WHERE barbero_id = @barbero
 ORDER BY dia_semana, hora_inicio;

-- 4) Restaurar horarios al estado "antes".
--    Nada referencia horarios_trabajo, así que se puede borrar y reinsertar.
DELETE FROM horarios_trabajo WHERE barbero_id = @barbero;

INSERT INTO horarios_trabajo (barbero_id, dia_semana, hora_inicio, hora_fin, activo) VALUES
  (1, 1, '09:00:00', '13:00:00', 1),
  (1, 1, '15:00:00', '19:00:00', 1);
  -- ...completar con las filas del SELECT "antes", incluido `activo`

-- 5) Comprobar
SELECT id, dia_semana, hora_inicio, hora_fin, activo
  FROM horarios_trabajo
 WHERE barbero_id = @barbero
 ORDER BY dia_semana, hora_inicio;
```

### 9.3 Guion

| # | Qué hacer | Qué debes ver |
|---|---|---|
| a | `pnpm lint`, `pnpm test` (también `TZ=UTC` y `TZ=Asia/Tokyo`), `pnpm build`. | 0 errores; 262 pruebas en verde. |
| b | Pulsar "Copiar" y luego "Ver como cliente". | El portapapeles tiene el link exacto y se abre `/b/{codigo}` en otra pestaña. |
| c | Crear "TEST-Corte" ($20.000, 30 min). | Aparece en Ajustes y en la página pública como servicio reservable. |
| d | Editarlo a $25.000 y 45 min. | La disponibilidad pública usa 45 min y el precio nuevo. |
| e | Desactivar y luego reactivar. | Desaparece de la página pública, sigue en Ajustes como "Inactivo" al final; al reactivar vuelve. |
| f | Probar nombre vacío / 101 caracteres, precio 0, negativo, decimal, texto, duración 0, 3, 481 y 32. | "Guardar" desactivado con el motivo bajo cada campo. |
| g | Cambiar un bloque a 09:00–13:00, agregar 15:00–19:00 y guardar. Luego intentar 13:00–09:00 o un cruce. Apagar un día y guardar. | Hoy muestra los bloques nuevos y la disponibilidad pública los respeta; los errores se ven sin perder lo escrito; el día apagado deja de ofrecerse. |
| h | Abrir dos pestañas, editar en una y recargar la otra. | La segunda muestra los datos nuevos. |
| i | Doble clic rápido en "Guardar" de un día. | Una sola secuencia de peticiones en Network (el botón se desactiva). |
| j | Apagar el backend y recargar. | Cada sección (link, servicios, horarios) muestra su error con "Reintentar"; una mutación fallida conserva lo escrito. |
| k | Borrar o alterar el token. | La app redirige a `/login` sin pantallas rotas. |
| l | Cerrar sesión y entrar con barbero2. | Solo ve sus servicios, sus horarios y su link. |
| m | Revisar con barbero1 que no aparece nada de barbero2 (y al revés). | Aislamiento total: los endpoints filtran por el JWT. |
| n | Revisar a 390 px, el selector de hora en iPhone y la navegación con teclado. | Sin scroll horizontal, objetivos ≥ 40 px, foco atrapado en los sheets, Esc y retorno del foco. |
| o | `git status` y búsqueda de `#hex`. | Sin `.env`, `node_modules` ni `dist`; ningún hex fuera de `tokens.css`. |
