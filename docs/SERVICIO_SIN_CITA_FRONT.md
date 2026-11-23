# Cliente sin cita — Frontend

Registro de un cliente que llega de la calle y se quiere motilar en el momento,
sin reserva. El backend ya lo permite; esta pantalla vive en la PWA del barbero.

Contrato de referencia: enunciado del prompt + `docs/backend/SERVICIOS.md`
(catálogo) y `docs/backend/ATENCIONES_Y_PROPINAS.md` (Atendido y propina). No se
inventó ningún campo ni endpoint.

## 1. Reglas del registro

| Modo | Efecto | Propina |
|---|---|---|
| `atendido` («Ya lo atendí») | El servicio queda `atendida` y el dinero (cobrado + propina) suma de una vez al balance del día. No ocupa agenda. | Sí, opcional (1–1.000.000). |
| `en_curso` («Empezar ahora») | La cita queda `aceptada` y bloquea la agenda desde ahora durante la duración de los servicios. Termina con «Atendido» desde el inicio. | **No**: con `en_curso` el backend responde 400. |

En ningún caso se envían WhatsApp, push ni recordatorios.

- `Authorization: Bearer {token}` de barbero. **Nunca** se envía `barberoId`
  (sale del JWT; mandarlo en el body da 400).
- `servicioIds`: 1 a 10, sin repetir, de servicios activos del barbero.
- `montoCobrado`: entero 0–10.000.000. Es el monto **final** que cobra el
  barbero; si se omite, el backend usa la suma de precios del catálogo.
- `clienteNombre`: hasta 100 caracteres; vacío equivale a omitirlo (el backend
  devuelve `"Cliente sin cita"`).
- `clienteCelular`: celular colombiano; acepta `+57`, espacios y guiones, y se
  envía normalizado a 10 dígitos.
- Horarios: los calcula el backend con la hora de Bogotá. `en_curso` empieza
  ahora y termina ahora + duración; `atendido` termina ahora y empieza ahora −
  duración.
- La respuesta 201 es el mismo DTO de cita del dashboard con
  `origen: "sin_cita"`. Las citas `sin_cita` **nunca** traen `whatsappUrl`.

## 2. Endpoints

| Uso | Endpoint |
|---|---|
| Catálogo del selector (solo activos) | `GET /barbero/servicios` |
| Registrar | `POST /barbero/servicios-sin-cita` → **201** |
| En curso → terminar | `POST /barbero/citas/:id/atendido` (body opcional `{ montoPropina }`) |
| En curso → el cliente se fue | `POST /barbero/citas/:id/cancelar` (body opcional `{ motivo }`) |
| Corregir la propina (solo el mismo día) | `PUT /barbero/citas/:id/propina` (`0` la quita) |
| Balance del día | `GET /barbero/balance/hoy` (ya incluye estos cobros) |

No se ofrece «Proponer cambio de hora» en una cita `sin_cita`: el backend
responde 409.

## 3. Estructura

```text
src/features/agenda/
  types.ts                          ServicioSinCita, ModoServicioSinCita,
                                    CuerpoServicioSinCita, OrigenCita y
                                    `resumen.sinCita`
  api.ts                            obtenerServiciosActivos, registrarServicioSinCita
  claves.ts                         ['barbero','servicios','activos']
  hooks.ts                          useServiciosActivos,
                                    useRegistrarServicioSinCita
  components/SheetClienteSinCita.tsx  selector, monto, propina y datos
  domain/sinCita.ts                 totales, selección, validación y cuerpo
  domain/sinCita.test.ts
  domain/errores.ts                 acción `servicioSinCita`
  domain/agenda.ts                  esServicioSinCita, contadores.sinCita
  HoyPage.tsx                       botón, chip «Sin cita» y acciones filtradas
```

## 4. El Sheet

Punto de entrada: botón principal **«Cliente sin cita»** debajo de los
contadores de Hoy (`/app/hoy`). Debajo se muestra «Hoy registraste N servicios
sin cita» con `resumen.sinCita` cuando es mayor que 0.

1. **Modo** (`Segmented`, dos opciones): «Ya lo atendí» / «Empezar ahora», con
   una línea que explica el efecto de cada uno. El modo se elige **antes** de
   confirmar, así la propina nunca aparece (ni viaja) con `en_curso`.
2. **Servicios**: lista seleccionable con nombre, precio y duración; contador
   `N/10` y aviso al intentar el 11.º. El catálogo se pide al abrir el Sheet
   (`useServiciosActivos`), solo activos.
3. **Total del catálogo** en mono grande, con la duración total. Si la suma sale
   de 5–600 minutos se avisa y no se puede enviar.
4. **Monto cobrado**: `MoneyInput` prellenado con el total, entero 0–10.000.000.
   Se envía **solo si el barbero lo cambió** respecto al total del catálogo.
   Vacío equivale a no enviarlo (el backend usa el catálogo).
5. **Propina** (solo en «Ya lo atendí»): «¿Dejó propina?» No / Sí, `MoneyInput`
   con teclado numérico y atajos $2.000, $5.000 y $10.000, igual que el Sheet
   «Cliente atendido».
6. **Nombre y celular** (opcional, plegado por defecto): el botón tiene
   `aria-expanded`/`aria-controls`; el celular se valida con la misma regla de
   la reserva pública (`normalizarCelular`). Si hay un error en un campo oculto,
   al confirmar se despliega solo.
7. **Confirmar** («Registrar cobro» o «Empezar ahora» según el modo) y
   «Volver». Al recibir 201: toast «Servicio registrado», se cierra el Sheet y
   se invalida todo `['barbero']`, lo que refresca el dashboard y el balance.

Estados del catálogo: skeleton, `EstadoError` con «Reintentar» y vacío («No
tienes servicios activos», con la indicación de crearlos en Ajustes).

Montos en pesos enteros, sin decimales, con `formatearPesos`/`Money`.

## 5. Dashboard

- Cada cita trae `origen`. Las `sin_cita` muestran el chip **«Sin cita»** junto
  al nombre.
- En una cita `sin_cita` se ocultan «No asistió», «Proponer/Cambiar» hora y el
  bloque de propuesta; quedan «Atendido» y la X de cancelar, que es lo que
  necesita un `en_curso`.
- Un `en_curso` aparece como `aceptada` con sus botones normales y ya descuenta
  su tiempo de `huecosLibres`.

## 6. Errores

| Código | Caso | Mensaje en la app |
|---|---|---|
| 400 | `Servicio no válido` | «Ese servicio ya no está disponible. Actualiza la lista e inténtalo de nuevo.» (y se relee el catálogo) |
| 400 | `Celular no válido` | «Revisa el celular: deben ser 10 dígitos que empiecen por 3.» |
| 400 | Propina con `en_curso` | «La propina solo se registra al marcar «Atendido».» |
| 400 | Duración total inválida | «La duración total debe estar entre 5 y 600 minutos.» |
| 400 | Validación (array) | Primer mensaje del arreglo (`campos[0]`) |
| 401 / 403 | Sesión inválida o token de cliente | El cliente HTTP cierra sesión y manda al login |
| 409 | `Se cruza con la cita aceptada de las HH:mm` | El texto tal cual, más la sugerencia «Si el cliente ya está sentado, regístralo con «Ya lo atendí».» y relectura de la agenda |

La comparación de los 400 es estricta (`^servicio no válido$`) para no capturar
mensajes de validación como `servicioIds should not be empty`, que se muestran
tal cual.

## 7. Pruebas

- `domain/sinCita.test.ts` — totales y duraciones, alternar con límite de 10,
  monto vacío/0/fuera de rango, propina ignorada en `en_curso`, nombre de 100,
  celular `+57`, y el cuerpo del POST (monto solo si cambia, propina solo en
  `atendido`, datos recortados y omitidos si están vacíos).
- `components/SheetClienteSinCita.test.tsx` — sin servicios no registra, «Ya lo
  atendí» sin campos extra, monto editado, «Empezar ahora» sin propina, propina
  y datos del cliente, 409 de cruce y celular inválido que despliega el campo.
- `domain/errores.test.ts` — los cinco mapeos de `servicioSinCita`.
- `domain/agenda.test.ts` — `esServicioSinCita` y `contadores.sinCita`.

## 8. Lo que no se implementó

- Enviar WhatsApp, push o recordatorios: el contrato no los envía en este flujo.
- Ofrecer «Proponer cambio de hora» sobre una cita `sin_cita` (409).
- Editar después los datos del cliente: no hay endpoint; se corrigen con
  «Atendido» (propina) o «Cancelar».
- Registrar una propina al cerrar un `en_curso`: se hace con el Sheet
  «Cliente atendido» de siempre.
