# Jobs programados

## Job de expiración de solicitudes

Cada **5 minutos por defecto**, el job `expirar-solicitudes-vencidas` ejecuta:

```sql
UPDATE citas
   SET estado = 'expirada',
       cerrada_en = expira_en
 WHERE estado = 'pendiente'
   AND expira_en <= NOW()
```

Reglas:

- Solo afecta a citas en estado `pendiente` con `expira_en` vencido. **No toca**
  `aceptada`, `pendiente_pago` ni ningún otro estado, aunque su `expira_en` sea
  pasado.
- `cerrada_en` queda con el valor de `expira_en` (momento real del vencimiento,
  no la hora en que corrió el job).
- La comparación de tiempo es **en SQL con `NOW()`**, nunca en JavaScript.
- Es un `UPDATE` atómico e **idempotente**: ejecutarlo dos veces o desde dos
  instancias a la vez no daña nada (la segunda no encuentra filas que cambiar).
- No usa transacción larga ni bloqueos: una sola sentencia, una sola conexión
  por un instante.
- Solo registra en log cuando expira al menos una cita:
  `Expiradas N solicitudes`. Las ejecuciones vacías no escriben log.
- Cualquier error se captura y se registra sin relanzarlo: el job **nunca
  tumba la app** y la siguiente ejecución sigue normal.
- Una bandera en memoria evita que dos ejecuciones se solapen dentro del mismo
  proceso.

### Variables de entorno opcionales

```
JOB_EXPIRACION_CRON=   # expresión cron; por defecto "*/5 * * * *"
JOBS_ENABLED=false     # por defecto true; en false no se ejecuta ningún job
```

Se leen con `configService.get` y valor por defecto (no son obligatorias). El
cron por defecto es `*/5 * * * *` (cada 5 minutos).

Para pruebas manuales sin esperar 5 minutos:

```bash
JOB_EXPIRACION_CRON="*/10 * * * * *" pnpm start:dev
```

(6 campos = incluye segundos; cada 10 segundos.)

### Comportamiento con varias instancias

El `UPDATE` es atómico e idempotente, así que si dos instancias de la app
corren el job a la vez, ambas ejecutan el mismo `UPDATE` y solo una afecta las
filas; la otra afecta 0. No hay doble expiración ni estado roto. La bandera de
solapamiento solo protege dentro de un mismo proceso.

### Qué NO hace este job

- No crea balance diario (el balance es por upsert por demanda).
- No expira `pendiente_pago` ni retenciones de 15 min (Fase 2).
- No concilia pagos (Fase 2).
- No envía notificaciones al expirar.
- No toca `aceptada`, `rechazada`, `cancelada`, `atendida` ni `no_asistio`.

## Cómo probar

Con el servidor arrancado con `JOB_EXPIRACION_CRON="*/10 * * * * *"`:

```bash
# Crear cita pública y vencerla por SQL
# (ver docs/PUBLICO_CREAR_CITA.md para el alta por API)

# Carrera aceptar vs job
node scripts/prueba-carrera-expiracion.js <tokenJWT> <citaId> <tokenSeguimiento>
```

Limpieza:

```sql
DELETE FROM citas WHERE invitado_nombre LIKE 'TEST-%';
DELETE FROM servicios WHERE nombre LIKE 'TEST-%';
DELETE FROM horarios_trabajo
WHERE barbero_id = 1 AND hora_inicio = '08:00' AND hora_fin = '12:00';
```
