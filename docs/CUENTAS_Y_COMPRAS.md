# Cuentas y Compras — panel del barbero

Prompt 4 del frontend. Implementa **Cuentas** (`/app/cuentas`) y **Compras**
(`/app/compras`) sobre el balance diario de la Fase 1.

Fuentes de verdad:

- `docs/backend/COMPRAS_Y_BALANCE.md` (balance, historial y CRUD de compras).
- `docs/backend/ATENCIONES_Y_PROPINAS.md` (de dónde vienen servicios y propinas).
- `docs/DISENO.md` 6.7 y 6.8.
- `PROJECT_CONTEXT.md`.

No se inventó ningún campo. Donde el diseño y el backend difieren, manda el
backend y queda anotado en `docs/DISENO.md` §9.

---

## 1. Estructura

```text
src/features/cuentas/
  types.ts                 Balance (hoy e historial)
  api.ts                   GET /barbero/balance/hoy y /historial
  claves.ts                claves con el día de Bogotá
  hooks.ts                 useBalanceHoy, useHistorialBalance
  CuentasPage.tsx          /app/cuentas
  components/GraficoNeto.tsx
  domain/
    balance.ts             barras, lista de días, aria-label, filas, coherencia
    dia.ts                 fecha de Bogotá para las claves
    balance.test.ts

src/features/compras/
  types.ts                 Compra, ListaCompras, RespuestaCompra, cuerpos
  api.ts                   GET/POST/PATCH/DELETE /barbero/compras
  claves.ts                claves con el día de Bogotá
  hooks.ts                 useCompras + 3 mutaciones
  ComprasPage.tsx          /app/compras
  components/SheetEditarCompra.tsx
  domain/
    compra.ts              validación del formulario
    errores.ts             mapa de errores
    compra.test.ts / errores.test.ts
```

Compartido nuevo:

- `src/shared/lib/montos.ts` — formateo de miles e interpretación de montos
  escritos (`"27.000"`, `"$27.000"`, `"27000"`).
- `src/shared/ui/MoneyInput.tsx` — campo de monto con teclado numérico y puntos
  de miles. **Extraído del sheet de propina sin cambiar su comportamiento**;
  ahora lo usan propina y compras.

---

## 2. Claves de consulta

```ts
clavesBalance.hoy(fecha)        // ['barbero','balance','hoy', fecha]
clavesBalance.historial(fecha)  // ['barbero','balance','historial', fecha]
clavesCompras.lista(fecha)      // ['barbero','compras', fecha]
```

- `fecha` es **hoy en Bogotá** (`fechaConsulta`), nunca la zona del equipo.
- Al pasar la medianoche la clave cambia y TanStack Query pide sola los datos
  del nuevo día. No hay temporizadores agresivos: un reloj de 60 s
  (`useAhora`) detecta el cambio de día con la app abierta.
- Todas cuelgan de `['barbero']`, así que la invalidación de las acciones de
  Hoy/propina (`invalidateQueries({ queryKey: ['barbero'] })`) ya refrescaba el
  balance y sigue cubriendo compras e historial.
- Refresco: foco de ventana (`refetchOnWindowFocus`), reconexión y cambio de
  pestaña (`AppLayout` vuelve a pedir agenda y solicitudes al navegar).
- Tras crear o editar una compra se usa el `balance` que devuelve la API para
  adelantar la caché de hoy (`setQueryData`) y además se invalidan lista de
  compras, balance de hoy e historial. `DELETE` responde 204, así que solo
  invalida.

---

## 3. Pantalla Cuentas (`/app/cuentas`)

- Eyebrow "HOY · SE REINICIA 12:00 A. M. BOGOTÁ", título "Cuentas".
- Tarjeta financiera principal (radio 24, padding 24): "GANANCIA NETA" en 44 px
  mono, en rojo y con el signo delante del símbolo si es negativa (`-$7.000`).
  Debajo, separador y tres filas:
  - Servicios cobrados (`resumen.totalServicios`, con `+`).
  - Propinas (`totalPropinas`, con `+`).
  - Compras de insumos (`totalCompras`, con `−`, en rojo).
  - Los ceros se muestran en tenue y sin signo.
- **La pantalla siempre muestra `gananciaNeta` de la API**; nunca la recalcula.
  `esBalanceCoherente()` solo comprueba en pruebas que
  `servicios + propinas − compras = gananciaNeta`.
- Gráfico "Últimos 30 días · neto diario":
  - 30 barras cronológicas (izquierda = más antiguo, derecha = hoy), gap 3 px,
    radio 2 px, alto máximo 88 px y mínimo 2 px.
  - Altura proporcional al mayor valor absoluto del periodo.
  - Blanco al 15 % las positivas, rojo al 70 % las negativas, hueso la de hoy.
  - Los días en cero son una marca de 2 px.
  - `role="img"` con un `aria-label` que resume rango, hoy, mejor y peor día.
    Sin interacción.
- Lista de días anteriores (por **fecha**, no por posición): fecha en texto
  secundario ("Dom, 25 de oct"), neto a la derecha en mono (rojo si es negativo,
  tenue si es cero), separadores de 1 px. No se puede tocar: el backend no
  guarda detalle.
- Estados: skeleton al cargar, error con "Reintentar" y "Aún no hay movimientos"
  **solo en la lista** cuando los 30 días están en cero (la tarjeta y el gráfico
  se muestran igual con ceros).

---

## 4. Pantalla Compras (`/app/compras`)

- Eyebrow "INSUMOS · SALIDA DE CAJA", título "Compras".
- Formulario en tarjeta:
  - DESCRIPCIÓN (placeholder "Ej. Gel fijador x2"). Sin `maxLength`: se permite
    escribir de más para poder explicar el límite de 150. El contador
    (`131/150`) aparece solo cuando faltan menos de 20 caracteres.
  - MONTO con `MoneyInput` (teclado numérico, puntos de miles, solo dígitos al
    pegar). Ayuda permanente "Entre $1 y $50.000.000".
  - "Registrar compra" desactivado hasta que el formulario sea válido; mientras
    envía muestra el spinner y no acepta dobles clics.
  - Al registrar: se limpia el formulario, el foco vuelve a la descripción,
    toast "Compra registrada" y la lista se actualiza.
- Lista de hoy: encabezado "Hoy" con el `total` del día (lo calcula el
  servidor) y filas con descripción y `− $27.000` en rojo. Tocar una fila abre
  el sheet.
- Estados: "Aún no hay compras hoy", skeleton y error con "Reintentar".
- Sheet "Editar compra": descripción y monto editables, "Guardar" desactivado
  si no hay cambios o el formulario es inválido, y "Eliminar compra" (rojo) que
  abre una confirmación ("Esta acción no se puede deshacer"). Si la API responde
  **409** o **404** se muestra el mensaje, se cierra el sheet y la lista se
  refresca. Los demás errores se muestran dentro del sheet sin perder lo escrito.

---

## 5. Reglas de validación

| Campo | Regla | Fuente |
|---|---|---|
| Descripción | 1–150 caracteres tras recortar espacios | `COMPRAS_Y_BALANCE.md` |
| Monto | Entero 1–50.000.000 | `COMPRAS_Y_BALANCE.md` |
| Formato del monto | Acepta `27000`, `27.000` y `$27.000`. Rechaza decimales (`27,5`, `27.5`), negativos y letras | Regla de UI |
| `fechaBalance` | La pone el servidor; el cliente nunca la envía | `COMPRAS_Y_BALANCE.md` |
| Fecha de la lista | Solo hoy; el `?fecha=` debe estar en los últimos 30 días y no ser futura | `COMPRAS_Y_BALANCE.md` |

---

## 6. Mapa de errores

`src/features/compras/domain/errores.ts`.

| Código | Mensaje | Refresca |
|---|---|---|
| red (0) | "No pudimos conectar. Revisa tu internet." | No |
| 400 | Mensaje de la API (o `campos[0]`) | No |
| 401 | "Tu sesión expiró. Vuelve a iniciar sesión." (el cliente redirige) | No |
| 403 | Mensaje de la API o "No tienes permiso para esta acción." | No |
| 404 | Mensaje de la API (`Compra no encontrada`) | Sí |
| 409 | "Esta compra ya no se puede modificar" | Sí |
| 429 | "Demasiados intentos, espera un momento." | No |
| 5xx | "Algo salió mal. Inténtalo de nuevo." | Sí |

---

## 7. Qué NO se muestra en la Fase 1

- `totalAnticipos` y `totalDevoluciones` llegan en la respuesta pero **siempre
  valen 0** (`COMPRAS_Y_BALANCE.md`: "existen pero valen 0 hasta la Fase 2"). No
  se muestran.
- Nada de pagos, retenciones, verificación de celular ni recordatorios.
- Ajustes, onboarding y push quedan para prompts posteriores.
- La lista de días no tiene detalle: el backend no guarda el desglose.

---

## 8. Pruebas manuales

Backend en `http://localhost:3000`, frontend en `http://localhost:3001`,
barbero de pruebas `barbero1` / `BARB-0001` (`barbero_id = 1`).

### 8.1 SELECT "antes" (ejecutar y guardar antes de todo)

```sql
SET @hoy := DATE(UTC_TIMESTAMP() - INTERVAL 5 HOUR);   -- Bogotá = UTC-5
SET @barbero := 1;

SELECT barbero_id, fecha, total_anticipos, total_servicios, total_propinas,
       total_devoluciones, total_compras, ganancia_neta
  FROM balance_resumen_diario
 WHERE barbero_id = @barbero AND fecha = @hoy;
```

- Con fila → anota los seis totales (son los valores a restaurar).
- Sin fila → la prueba la creará y al final hay que borrarla.

### 8.2 Preparación

**Paso 0 — ver qué filas se van a tocar** (los días de prueba):

```sql
SET @hoy := DATE(UTC_TIMESTAMP() - INTERVAL 5 HOUR);
SET @barbero := 1;

SELECT barbero_id, fecha, total_servicios, total_propinas, total_compras, ganancia_neta
  FROM balance_resumen_diario
 WHERE barbero_id = @barbero
   AND fecha IN (DATE_SUB(@hoy, INTERVAL 1 DAY), DATE_SUB(@hoy, INTERVAL 2 DAY),
                 DATE_SUB(@hoy, INTERVAL 3 DAY), DATE_SUB(@hoy, INTERVAL 5 DAY),
                 DATE_SUB(@hoy, INTERVAL 29 DAY), DATE_SUB(@hoy, INTERVAL 31 DAY))
 ORDER BY fecha DESC;
```

Si alguno de esos días tiene datos reales, **detente**: usa otra base o cambia
las fechas. En una base de pruebas no debe devolver nada.

**(1) Historial variado**: positivos, negativo, cero, hace 29 días y hace 31
días (este último **no** debe aparecer en la pantalla porque el historial son 30
días contando hoy).

```sql
SET @hoy := DATE(UTC_TIMESTAMP() - INTERVAL 5 HOUR);
SET @barbero := 1;

DELETE FROM balance_resumen_diario
 WHERE barbero_id = @barbero
   AND fecha IN (DATE_SUB(@hoy, INTERVAL 1 DAY), DATE_SUB(@hoy, INTERVAL 2 DAY),
                 DATE_SUB(@hoy, INTERVAL 3 DAY), DATE_SUB(@hoy, INTERVAL 5 DAY),
                 DATE_SUB(@hoy, INTERVAL 29 DAY), DATE_SUB(@hoy, INTERVAL 31 DAY));

INSERT INTO balance_resumen_diario
  (barbero_id, fecha, total_anticipos, total_servicios, total_propinas,
   total_devoluciones, total_compras, ganancia_neta)
VALUES
  (@barbero, DATE_SUB(@hoy, INTERVAL 1 DAY),  0,  60000, 5000, 0, 10000,  55000),
  (@barbero, DATE_SUB(@hoy, INTERVAL 2 DAY),  0,      0,    0, 0, 15000, -15000),
  (@barbero, DATE_SUB(@hoy, INTERVAL 3 DAY),  0,      0,    0, 0,     0,      0),
  (@barbero, DATE_SUB(@hoy, INTERVAL 5 DAY),  0, 120000,    0, 0,     0, 120000),
  (@barbero, DATE_SUB(@hoy, INTERVAL 29 DAY), 0,  30000,    0, 0, 20000,  10000),
  (@barbero, DATE_SUB(@hoy, INTERVAL 31 DAY), 0,  90000,    0, 0,     0,  90000);
```

**(2) Compra TEST- con `fecha_balance` de ayer**, coherente con el balance.
Primero se crea por la API (para que valide descripción y monto y use el día
real) y después se mueve con SQL:

```bash
# 1) Crear la compra (queda con fecha_balance = hoy)
curl -s -X POST http://localhost:3000/barbero/compras \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"descripcion":"TEST-CompraAyer","monto":12000}'
```

```sql
SET @hoy := DATE(UTC_TIMESTAMP() - INTERVAL 5 HOUR);
SET @barbero := 1;
SET @monto := 12000;

-- 2) Moverla a ayer
UPDATE compras
   SET fecha_balance = DATE_SUB(@hoy, INTERVAL 1 DAY)
 WHERE barbero_id = @barbero AND descripcion = 'TEST-CompraAyer';

-- 3) Deshacer su efecto en el balance de hoy (la API ya lo había sumado)
UPDATE balance_resumen_diario
   SET total_compras = GREATEST(total_compras - @monto, 0),
       ganancia_neta = ganancia_neta + @monto
 WHERE barbero_id = @barbero AND fecha = @hoy;

-- 4) Aplicar su efecto en el balance de ayer
INSERT INTO balance_resumen_diario
  (barbero_id, fecha, total_anticipos, total_servicios, total_propinas,
   total_devoluciones, total_compras, ganancia_neta)
VALUES (@barbero, DATE_SUB(@hoy, INTERVAL 1 DAY), 0, 0, 0, 0, @monto, -@monto)
ON DUPLICATE KEY UPDATE
  total_compras = total_compras + @monto,
  ganancia_neta = ganancia_neta - @monto;
```

### 8.3 Limpieza

```sql
SET @hoy := DATE(UTC_TIMESTAMP() - INTERVAL 5 HOUR);
SET @barbero := 1;

-- Paso 1: ver qué se va a borrar
SELECT id, barbero_id, descripcion, monto, fecha_balance
  FROM compras
 WHERE barbero_id = @barbero AND descripcion LIKE 'TEST-%';

SELECT barbero_id, fecha, total_servicios, total_propinas, total_compras, ganancia_neta
  FROM balance_resumen_diario
 WHERE barbero_id = @barbero
   AND fecha IN (DATE_SUB(@hoy, INTERVAL 1 DAY), DATE_SUB(@hoy, INTERVAL 2 DAY),
                 DATE_SUB(@hoy, INTERVAL 3 DAY), DATE_SUB(@hoy, INTERVAL 5 DAY),
                 DATE_SUB(@hoy, INTERVAL 29 DAY), DATE_SUB(@hoy, INTERVAL 31 DAY));

-- Paso 2: borrar compras TEST
DELETE FROM compras
 WHERE barbero_id = @barbero AND descripcion LIKE 'TEST-%';

-- Paso 3: borrar las filas de balance de prueba de días anteriores
DELETE FROM balance_resumen_diario
 WHERE barbero_id = @barbero
   AND fecha IN (DATE_SUB(@hoy, INTERVAL 1 DAY), DATE_SUB(@hoy, INTERVAL 2 DAY),
                 DATE_SUB(@hoy, INTERVAL 3 DAY), DATE_SUB(@hoy, INTERVAL 5 DAY),
                 DATE_SUB(@hoy, INTERVAL 29 DAY), DATE_SUB(@hoy, INTERVAL 31 DAY));

-- Paso 4a: si el SELECT "antes" trajo fila, restaurarla EXACTAMENTE
UPDATE balance_resumen_diario
   SET total_anticipos    = <antes.total_anticipos>,
       total_servicios    = <antes.total_servicios>,
       total_propinas     = <antes.total_propinas>,
       total_devoluciones = <antes.total_devoluciones>,
       total_compras      = <antes.total_compras>,
       ganancia_neta      = <antes.ganancia_neta>
 WHERE barbero_id = @barbero AND fecha = @hoy;

-- Paso 4b: si el SELECT "antes" NO trajo fila, borrar la de hoy
DELETE FROM balance_resumen_diario
 WHERE barbero_id = @barbero AND fecha = @hoy;

-- Paso 5: comprobar que quedó igual que "antes"
SELECT barbero_id, fecha, total_anticipos, total_servicios, total_propinas,
       total_devoluciones, total_compras, ganancia_neta
  FROM balance_resumen_diario
 WHERE barbero_id = @barbero AND fecha = @hoy;
```

Borrar compras **no revierte** el balance: por eso el paso 4 es obligatorio.

### 8.4 Guion de pruebas

| # | Qué hacer | Qué debes ver |
|---|---|---|
| a | `pnpm lint`, `pnpm test` (también `TZ=UTC` y `TZ=Asia/Tokyo`) y `pnpm build`. | 0 errores; 210 pruebas en verde. |
| b | Abrir `/app/cuentas` con el día en ceros (y sin historial). | Tarjeta en `$0`, gráfico con 30 marcas de 2 px, "Aún no hay movimientos" en la lista. |
| c | Registrar "TEST-Navajas" por $27.000 en `/app/compras`. | Aparece en la lista, el total de "Hoy" sube y en Cuentas "Compras de insumos" muestra `− $27.000` con la ganancia neta ajustada. |
| d | Registrar "TEST-Talco" por $15.000, editar la primera a $30.000 y eliminar la segunda. | Después de cada paso el balance coincide con la base: `total_compras` del día = suma de las compras de esa `fecha_balance`. |
| e | Marcar una cita como Atendido con propina desde Hoy y volver a Cuentas. | Servicios y propinas suben el monto correcto; `gananciaNeta = servicios + propinas − compras`. |
| f | Aplicar el SQL (1). | Gráfico con 30 barras cronológicas, negativas en rojo, hoy en hueso; lista del más reciente al más antiguo, sin hoy, con formato "Dom, 25 de oct"; el día de hace 31 días no aparece. |
| g | Probar el formulario: monto 0, negativo, decimal, texto, 50.000.001 y descripción vacía, solo espacios o de 151 caracteres. | El botón queda desactivado y cada campo explica el motivo. Pegar "$27.000" lo deja como 27.000. |
| h | Aplicar el SQL (2) con el sheet de edición abierto y guardar. | Mensaje del 409 ("Esta compra ya no se puede modificar"), el sheet se cierra y la lista se refresca. |
| i | Doble clic rápido en "Registrar compra". | Una sola petición en Network. |
| j | Apagar el backend y recargar. | Cuentas y Compras muestran error con "Reintentar"; al encenderlo se recuperan. Una compra fallida deja el formulario con el mensaje y lo escrito. |
| k | Entrar como barbero2. | Solo se ven sus propias compras y su balance. |
| l | Revisar la prueba unitaria de cambio de día. | `fechaConsulta` y las claves cambian al pasar la medianoche de Bogotá. |
| m | Revisar a 390 px y navegar con teclado (formulario y sheet). | Sin scroll horizontal, teclado numérico en el celular, foco atrapado en el sheet, Esc y retorno del foco. |
| n | Inspeccionar el gráfico. | `role="img"` con un `aria-label` que resume rango, hoy, mejor y peor día. |
| o | `git status` y búsqueda de hexadecimales. | Sin `.env`, `node_modules` ni `dist`; ningún hex fuera de `tokens.css`. |
