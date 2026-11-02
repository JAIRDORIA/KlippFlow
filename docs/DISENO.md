# KlippFlow — Documento de diseño (v1)

Fuente de verdad visual y de comportamiento del frontend.
- Tokens exactos exportados de Figma Make: `docs/figma-tokens.md`.
- Contrato de la API: `docs/backend/` (copia de los docs del backend). Si algo no coincide con lo que dice este documento, manda el backend y se avisa; nunca se inventan campos.
- El Figma es referencia de estilo, no pantalla final. Donde este documento y el Figma difieran, manda este documento.

## 1. Principios

- Tema oscuro único (sin modo claro). Móvil primero (390 px de referencia). En escritorio, la app va en un contenedor centrado de máximo 900 px con radio 40 y la sombra de escritorio de los tokens.
- Sobrio y rápido. El hueso (`--accent`) es el único acento; verde, ámbar y rojo solo significan estado.
- Instrument Sans para texto. DM Mono para números, horas, montos, celulares, fechas, enlaces, métricas y etiquetas superiores (eyebrows).
- Español de Colombia, tuteo, tono directo.
- Zona horaria de negocio `America/Bogota` para "hoy", "ahora" y cualquier fecha. Nunca usar la zona del dispositivo.
- Accesibilidad: objetivos táctiles de al menos 40 px, foco visible (2 px hueso, offset 2), respetar `prefers-reduced-motion`, no depender solo del color (ocupado va tachado, los estados llevan texto), respetar áreas seguras de iPhone (`env(safe-area-inset-*)`).

## 2. Tokens

Fuente única: variables CSS en `:root`. Ningún componente usa hex directos.

```css
:root {
  --bg-outer: #060606;   /* html, body, #root, fuera del contenedor */
  --bg: #0D0D0E;         /* fondo de la app, navegación, theme-color PWA */
  --card: #151516;       /* tarjetas, formularios, inputs */
  --elevated: #1C1C1E;   /* sheets, toast, opción activa de segmentados */
  --border: rgba(255,255,255,0.08);
  --text: #ECEBE7;       /* texto principal */
  --text-2: #96948E;     /* secundario */
  --text-dim: #5F5E5A;   /* tenue: metadatos, inactivos */
  --accent: #D9D0BF;     /* hueso: botón principal, selección, nav activa */
  --ink: #121211;        /* texto sobre hueso */
  --green: #86B894;      /* libre, atendido, confirmaciones */
  --amber: #DBA75F;      /* solicitudes, por confirmar, urgencia */
  --red: #CC746D;        /* ocupado, compras, pérdidas, destructivo */
  --white: #FFFFFF;
  --black: #000000;
}
```

Variantes con opacidad (derivarlas de los tokens, p. ej. con `color-mix` o variables `--green-10`, etc.):
- Hueso: 60 % borde de input enfocado; 40 % borde de próxima cita y hover de opciones; 20 % anillo de próxima cita.
- Verde: 40 % borde de horario libre; 30 % borde de chip libre; 20 % hover; 10 % fondo.
- Ámbar: 70 % texto de pendiente desactivado; 40 % borde de "Cita creada"; 30 % borde de advertencias y pendientes; 10 % fondo.
- Rojo: 70 % barras negativas del gráfico; 60 % texto de ocupado desactivado; 40 % borde de botón destructivo; 30 % borde de ocupado; 10 % fondo y hover destructivo.
- Blanco: 20 % hover de bordes; 15 % barras del gráfico y tirador del sheet; 10 % switch apagado; 5 % halo del login y hover de botón ghost.
- Tarjeta 60 % (citas no prioritarias) y 50 % (servicios, fechas y opciones sin seleccionar). Barra de navegación: `--bg` al 95 % con `backdrop-filter: blur(8px)`.
- Overlay de sheets: negro 65 %.

Contraste: `--text-dim` sobre `--bg` ronda 3:1 (por debajo de 4,5:1 para texto pequeño). Úsalo solo para información no esencial (metadatos, estados inactivos). Cualquier dato que el usuario necesite leer usa `--text-2` o `--text`. El valor vive en una sola variable por si el dueño decide aclararlo.

### Tipografía
- `--font-sans`: "Instrument Sans" (pesos 400, 500, 600), fallback `ui-sans-serif, system-ui, sans-serif`.
- `--font-mono`: "DM Mono" (pesos 400, 500), fallback `ui-monospace, monospace`.
- Fuentes autohospedadas (paquetes `@fontsource`), sin peticiones a Google Fonts.

| Rol | Fuente | px | Peso | Detalles |
|---|---|---|---|---|
| Marca del login | Sans | 48 | 600 | interlineado 0.95, tracking -0.04em |
| Métrica financiera principal | Mono | 44 | 400 | |
| Total de cobro (sheet) | Mono | 36 | 400 | |
| Título público | Sans | 36 | 600 | interlineado 1.02, tracking -0.035em |
| Título de pantalla | Sans | 34 | 600 | interlineado 1, tracking -0.035em |
| Métrica de resumen | Mono | 28 | 400 | |
| Hora o total destacado | Mono | 24 | 400 | |
| Título de tarjeta o sheet | Sans | 20 | 600 | tracking -0.025em |
| Día del calendario | Mono | 20 | 400 | |
| Mensaje destacado | Sans | 17 | 400 | |
| Texto base e introductorio | Sans | 16 | 400 | |
| Formulario y botón | Sans/Mono | 15 | 400 o 600 | |
| Estándar pequeño | Sans/Mono | 14 | 400 o 500 | |
| Auxiliar | Sans/Mono | 13 | 400 | |
| Pequeño (ayudas, leyendas) | Sans/Mono | 12 | 400 o 500 | |
| Label de campo | Sans | 12 | 500 | mayúsculas, tracking 0.12em |
| Eyebrow | Mono | 11 | 400 | mayúsculas, tracking 0.16em |
| Navegación inferior | Sans | 11 | 400 | |
| Badge numérico | Mono | 10 | 500 | |

### Formas, tamaños y espacios
- Tarjeta estándar: radio 16, padding 20. Tarjeta de agenda: radio 16, padding 16. Tarjeta financiera principal: radio 24, padding 24.
- Bloque de advertencia: radio 12, padding 14. Toast: radio 16. Sheet inferior: radio 28 solo arriba, padding superior 12, lados 24, inferior 32, alto máximo 90 %.
- Botón principal: alto 48, radio 16, padding horizontal 20. Botón de tarjeta: alto 40, radio 12. Botón de solicitud: alto 44, radio 16. Botón de horario: alto 44, radio 12. Botón del toast: alto 36, radio 12.
- Input y select: alto 48, radio 12, padding horizontal 16. Input de hora: alto 40, radio 8. Control segmentado: alto 48 total, padding 4, radio 12; opción: alto 40, radio 8.
- Botón de ícono cuadrado: 40 o 48, radio 12. Chips, badges, switch, indicador de agenda y tirador de sheet: píldora (radio 9999). Switch 48×28 con perilla de 20. Tirador del sheet 40×4. Barras del gráfico: radio 2.
- Padding horizontal de pantallas: 24 (28 en login, instalación y confirmación). Padding superior habitual 56 (login 48, confirmación 80), inferior 24. Separación título–contenido 28. Entre secciones 36 o 40. Gaps: 8, 12, 16. Gap del gráfico: 3.
- Bordes: 1 px `--border`. Input enfocado: `--accent` al 60 %. Tarjeta seleccionada: `--accent`. Estado vacío: 1 px punteado `--border`. Foco global visible: 2 px `--accent`, offset 2.
- Íconos: trazo 1.6, extremos redondeados. Tamaños: 20 por defecto, 22 navegación, 18 acciones principales, 16 chevron y añadir, 14 estados compactos, 26 en confirmación de cita. Usar una librería de íconos de trazo con `strokeWidth` ajustable.
- Movimiento: sheets y toast entran en 280 ms con `cubic-bezier(0.2,0.8,0.2,1)` subiendo 24 px con opacidad 0; fundido de 200 ms (cambio de pestaña y overlay); escala al presionar: 0.98 en botones, 0.97 en "Atendido". Botón desactivado al 35 % de opacidad.
- Sombras: contenedor de escritorio `0 40px 120px rgba(0,0,0,0.7)`; logo del login `0 24px 40px rgba(0,0,0,0.6)`; toast `0 25px 50px -12px rgba(0,0,0,0.25)`.

## 3. Componentes base

Button (primario hueso con texto `--ink`; ghost con texto `--text`; danger con borde rojo al 40 %), Card, Field (label + input + ayuda + error), Input, Select, Segmented, Chip, Badge (contador ámbar), Switch, Sheet (inferior, con overlay, tirador, cierre con Esc y toque fuera, bloqueo de scroll y foco atrapado), Toast (con acción opcional), ScreenHeader (eyebrow + título), BottomNav, Money, EmptyState (recuadro punteado con texto), Skeleton, Spinner, DaySelector, SlotButton.

## 4. Reglas de formato

- Montos: pesos colombianos enteros con punto de miles y símbolo `$`: `$30.000`. Negativos: `-$7.000` en grande; en listas `− $42.000` (signo menos con espacio). Siempre en DM Mono. Los montos de la API pueden llegar como número o como texto: convertir con `Number`.
- Cero: `$0` en color tenue.
- Fechas: meses y días en minúscula. Eyebrow: `LUNES · 26 OCT` (mayúsculas). Texto: `lunes 26 de octubre`; abreviado: `lun 26 oct`; listas de historial: `Dom, 25 de oct`. Relativos: `Hoy`, `Mañana`.
- Horas: 24 h en agenda, solicitudes y cuadrícula (`10:30`). En el editor de horarios se muestra 12 h con a. m./p. m. según el selector nativo; internamente siempre `HH:MM` de 24 h.
- Duración: `45 min`; mayores a 59: `1 h 12 min` en cuenta regresiva y `90 min` en servicios.
- Celular: se escribe como `317 884 1100` en pantalla; se envía a la API tal como lo acepte el backend (ver docs).
- Saludo del Hoy: `Buen día` antes de las 12:00, `Buenas tardes` de 12:00 a 18:59, `Buenas noches` desde las 19:00, con el primer nombre del barbero.
- Textos del usuario (nombres, servicios, descripciones) se muestran tal como se escribieron, sin cambiar mayúsculas.

## 5. Mapa de rutas

| Ruta | Zona | Pantalla |
|---|---|---|
| `/login` | barbero | Login |
| `/instalar` | barbero | Onboarding de instalación (iPhone) |
| `/app/hoy` | barbero | Hoy |
| `/app/solicitudes` | barbero | Solicitudes |
| `/app/cuentas` | barbero | Cuentas |
| `/app/compras` | barbero | Compras |
| `/app/ajustes` | barbero | Ajustes |
| `/b` | público | Pide el código del barbero |
| `/b/:codigo` | público | Reserva |
| `/cita/:token` | público | Seguimiento (también es la confirmación "Cita creada") |
| `/admin/login` | admin | Login de administrador |
| `/admin` | admin | Lista de barberos |
| `/admin/barberos/:id` | admin | Detalle de un barbero |

La raíz `/` redirige a `/app/hoy` si hay sesión de barbero y a `/login` si no. Las rutas `/app/*` exigen sesión de barbero; `/admin/*` (salvo login) exige sesión de admin. Una ruta desconocida muestra una pantalla "Página no encontrada" con enlace a la raíz. Las páginas públicas llevan `noindex`.

## 6. Pantallas

### 6.1 Login (`/login`)
- Logo arriba (210 px con la sombra del login y un halo blanco al 5 %), marca "KlippFlow" (48 px), lema "Tus citas, tu caja y tu agenda. Un solo lugar, en tu bolsillo.", campos USUARIO y CONTRASEÑA, botón "Entrar" (principal, desactivado hasta tener ambos), aviso "Tu cuenta la crea el administrador de KlippFlow. Si no puedes entrar, tu cuenta puede estar suspendida o vencida."
- No hay enlace para clientes ni botón de volver.
- Endpoint: `POST /auth/login/barbero` → guarda `accessToken` y el nombre del barbero.
- Errores: 401 "Usuario o contraseña incorrectos"; 403 "Tu cuenta no está activa. Habla con el administrador de KlippFlow."; 429 "Demasiados intentos. Espera un minuto e inténtalo de nuevo."; sin red "No pudimos conectar. Revisa tu internet."
- Tras entrar: si es iPhone, la app está abierta en Safari (no instalada) y no se descartó el onboarding, va a `/instalar`; si no, a `/app/hoy`.

### 6.2 Instalar (`/instalar`)
- Eyebrow "ANTES DE EMPEZAR · 1 MINUTO", título "Instala la app para no perder ninguna cita", texto "En iPhone, las notificaciones solo llegan si KlippFlow está en tu pantalla de inicio."
- Cuatro pasos numerados (01 a 04) con ícono a la derecha: Toca Compartir; Añadir a pantalla de inicio; Abre KlippFlow desde el ícono; Activa las notificaciones.
- Botón "Ya la instalé, continuar" y enlace "Hacerlo después" (guarda que se descartó y sigue a `/app/hoy`; en Ajustes queda una fila para volver a verlo).
- Se muestra solo en iPhone fuera del modo instalado (standalone). En Android y escritorio no aparece.
- Si pulsa "Ya la instalé" y sigue en Safari, muestra "Abre KlippFlow desde el ícono de tu pantalla de inicio para continuar."

### 6.3 Hoy (`/app/hoy`)
- Eyebrow con día y fecha, título "{saludo}, {nombre}".
- Tres contadores (Por atender, Libres, Solicitudes); Solicitudes en ámbar.
- "Agenda de hoy": línea de tiempo vertical. Cada cita: hora y duración a la izquierda (mono), punto en la línea, tarjeta con cliente, monto (mono), servicio, y si hay acompañantes una línea con ícono de personas ("Hijo (8 años): corte clásico").
- Estados: atendida (punto gris relleno, tarjeta al 60 %, línea "Atendido · propina $5.000" en verde, tocable para corregir la propina), próxima (anillo hueso de 4 px y borde `--accent` al 40 %), futura (punto vacío).
- Acciones de una cita aceptada: "Atendido" (principal compacto), "No asistió" (ghost; desactivado hasta la hora de inicio, usar `puedeMarcarNoAsistio` de la API) y botón "X" (cancelar).
- "Horarios libres": chips verdes en píldora con el rango y, debajo, "Bloques: 09:00–13:00 · 15:00–19:00" en mono pequeño.
- Estados: cargando (skeleton), sin citas ("No tienes citas para hoy" y los horarios libres), error con botón "Reintentar".
- Endpoints: `GET /barbero/dashboard/hoy`. No inventar campos: leer `docs/backend/BARBERO_SOLICITUDES_Y_DASHBOARD.md`.

### 6.4 Sheet "Cliente atendido"
- Título "Cliente atendido", nombre del cliente, tarjeta "COBRA EN PERSONA" con el total en 36 px mono y "Total completo · {servicio}", pregunta "¿Dejó propina?" con control No / Sí, botón "Confirmar cobro" y nota "Esta acción no se puede deshacer. La propina solo se corrige hoy."
- Al elegir "Sí" aparece un campo numérico (teclado numérico, puntos de miles) con atajos $2.000, $5.000 y $10.000. Propina válida: entero de 1 a 1.000.000; "Confirmar cobro" queda desactivado si "Sí" no tiene monto válido.
- Endpoint: `POST /barbero/citas/:id/atendido` con `{ montoPropina }` opcional.
- Modo edición de propina (desde la línea "Atendido · propina"): mismo sheet con el monto actual y opción de quitarla (enviar 0). Solo el mismo día. Endpoint `PUT /barbero/citas/:id/propina`. Fuera de plazo: mostrar el error de la API.
- Tras confirmar: cierra, refresca Hoy y Cuentas.

### 6.5 Otras acciones sobre una cita (sheets del mismo estilo)
- Rechazar solicitud: título "Rechazar solicitud", cliente y hora, dos opciones tipo tarjeta seleccionable ("Horario ocupado" → `horario_ocupado`; "No disponible" → `no_disponible`), botón danger "Rechazar solicitud" (desactivado hasta elegir) y ghost "Volver".
- Cancelar cita (botón "X" de la agenda): título "Cancelar cita", cliente y hora, campo "Motivo (opcional)" de hasta 255 caracteres con contador, botón danger "Cancelar cita" y ghost "Volver".
- No asistió: sheet de confirmación "¿Marcar como no asistió?" con aviso de que no se puede deshacer, botón danger y ghost.
- Tras aceptar, rechazar, cancelar o marcar no asistió: toast con el resultado y botón "Avisar" que abre `whatsappUrl` (la devuelve la API) en una pestaña nueva.
- Endpoints: `POST /barbero/citas/:id/aceptar | rechazar | cancelar | no-asistio`.

### 6.6 Solicitudes (`/app/solicitudes`)
- Eyebrow "ORDENADAS POR URGENCIA", título "Solicitudes", texto "Si no respondes en 2 horas, la solicitud expira y el horario queda libre."
- Cada tarjeta: arriba "expira en 38 min" (ícono de reloj, ámbar; usar `minutosRestantes`; formato `1 h 12 min`) y el monto; nombre; celular en mono; línea con fecha ("Hoy", "Mañana" o `sáb 31 oct`), hora de inicio grande (24 px mono), flecha, hora de fin y los servicios; si hay acompañantes, "2 personas" con el detalle de quién se hace qué; aviso ámbar con `avisoDescanso` cuando aplica; botones "Rechazar" (ghost) y "Aceptar" (principal).
- Orden: el que entrega la API. Estado vacío: "No tienes solicitudes pendientes".
- Si una solicitud expira mientras la pantalla está abierta, aceptar responde 409: mostrar "Esta solicitud ya expiró" y refrescar la lista.
- Badge de la barra inferior = cantidad de solicitudes.
- Endpoint: `GET /barbero/solicitudes`.

### 6.7 Cuentas (`/app/cuentas`)
- Eyebrow "HOY · SE REINICIA 12:00 A. M. BOGOTÁ", título "Cuentas".
- Tarjeta financiera principal: "GANANCIA NETA" con el valor en 44 px mono (rojo si es negativo) y tres filas: Servicios cobrados (+), Propinas (+), Compras de insumos (−, en rojo).
- Gráfico "Últimos 30 días · neto diario": 30 barras de izquierda (más antiguo) a derecha (hoy), alto proporcional al mayor valor absoluto; barras en blanco al 15 %, negativas en rojo al 70 %, hoy resaltado en hueso, días en cero como una marca de 2 px.
- Lista de días anteriores a hoy (sin repetir hoy): `Dom, 25 de oct` y el neto del día (rojo si es negativo, `$0` tenue si es cero). Sin detalle al tocar (el backend no guarda detalle).
- Endpoints: `GET /barbero/balance/hoy` y `GET /barbero/balance/historial` (llega del más reciente al más antiguo; invertir para el gráfico).

### 6.8 Compras (`/app/compras`)
- Eyebrow "INSUMOS · SALIDA DE CAJA", título "Compras".
- Formulario en tarjeta: DESCRIPCIÓN (ejemplo "Ej. Gel fijador x2", hasta 150 caracteres) y MONTO (teclado numérico, puntos de miles mientras se escribe, entero de 1 a 50.000.000), botón "Registrar compra" (desactivado hasta ser válido).
- Lista: encabezado "Hoy" con el total del día; filas con descripción y `− $27.000` en rojo. Estado vacío: "Aún no hay compras hoy".
- Tocar una fila abre un sheet con descripción y monto editables, "Guardar" y botón rojo "Eliminar compra" con confirmación. Solo compras de hoy; la API responde 409 para otros días y se muestra el mensaje.
- Al registrar, editar o eliminar se refresca Cuentas.
- Endpoints: `POST/GET/PATCH/DELETE /barbero/compras`.

### 6.9 Ajustes (`/app/ajustes`)
- Eyebrow "{NOMBRE} · {BARBERÍA}", título "Ajustes".
- Tarjeta "TU LINK PÚBLICO DE RESERVAS" con el enlace en mono y botones "Copiar" (principal) y "Compartir" (ghost; usa el menú nativo del teléfono y, si no existe, copia). Endpoint `GET /barbero/configuracion` (`linkReservas`).
- Servicios: encabezado con "+ Nuevo"; filas con nombre, duración, precio y chevron. Tocar abre el sheet de edición. Enlace discreto "Ver desactivados" para ver los inactivos atenuados y reactivarlos.
- Sheet "Nuevo servicio" / "Editar servicio": NOMBRE, DESCRIPCIÓN (opcional), PRECIO (entero) y DURACIÓN (MIN) (por defecto 30, pasos de 5), nota "La duración define cuánto tiempo se bloquea en tu agenda.", botón "Guardar" (desactivado hasta ser válido). En edición, botón rojo "Desactivar servicio" ("Las citas ya creadas no se afectan."). Límites exactos: `docs/backend/SERVICIOS.md`.
- Horarios: un renglón por día (Lunes a Domingo) con switch. Cada día lista sus bloques (hora inicio – hora fin, con "x" para quitar) y "+ Agregar bloque". Apagar un día desactiva sus bloques conservando las horas; encender un día sin bloques crea uno de 09:00 a 13:00. Guardado automático al cerrar el selector de hora; si es inválido (fin antes del inicio o bloques que se cruzan) se muestra el error y se vuelve al valor anterior. Nota: "Una cita puede terminar hasta 20 min después de cerrar un bloque, sin invadir el siguiente." Reglas y endpoints: `docs/backend/HORARIOS_Y_CONFIGURACION.md` (`dia_semana`: 0 = domingo).
- Notificaciones: fila con el estado (activadas o no), botón "Activar" (el permiso se pide con un toque del usuario) y "Enviar prueba". Endpoints `/barbero/push/*` (llave pública, suscribir, probar).
- Fila "Instalar en tu iPhone" que reabre `/instalar` (solo iPhone fuera del modo instalado).
- Botón "Cerrar sesión" (ghost, al final), con confirmación. Antes de cerrar, anula la suscripción push del dispositivo (`DELETE /barbero/push/suscripciones`), con tolerancia a fallos, y borra la sesión.

### 6.10 Reserva pública (`/b/:codigo`)
- Sin botón de volver ni etiquetas de demostración. Arriba: logo pequeño, título "{Nombre} · {Barbería}", texto "Reserva tu cita en menos de un minuto. Sin crear cuenta."
- Paso "1 · SERVICIOS": tarjetas seleccionables (círculo que se llena con un check hueso), nombre, descripción, precio y duración. Selección múltiple. Solo servicios activos.
- Paso "2 · ¿VAS SOLO?": control Voy solo / Con acompañantes. Con acompañantes: por cada uno un selector "Acompañante N: ¿qué se hará?" (opciones con nombre, precio y duración; un servicio por acompañante), botón "+ Agregar otro" y "x" para quitar. Máximo 4 personas contando al titular. Nota "Los acompañantes suman tiempo real de agenda."
- Paso "3 · FECHA Y HORA": selector horizontal de días (LUN, número) que parte de hoy y cubre el horizonte que permita el backend (ver `docs/backend/PUBLICO_INFO_Y_DISPONIBILIDAD.md`). La línea "Duración total · N min" suma a todas las personas. Cuadrícula de 4 columnas con las horas de `GET .../disponibilidad`: libre (verde, seleccionable), por confirmar (ámbar, desactivado), ocupado (rojo, tachado, desactivado); el seleccionado va en hueso con texto `--ink`. Leyenda: Libre, Por confirmar, Ocupado.
- Estados de este paso: sin servicios elegidos, recuadro punteado "Elige al menos un servicio para ver los horarios disponibles."; cargando horarios (skeleton); día sin horarios "Este día no hay horarios disponibles"; error con "Reintentar". Se consulta solo el día seleccionado, con una pequeña espera al cambiar servicios o personas, para respetar el límite de 30 peticiones por minuto.
- Paso "4 · TUS DATOS": NOMBRE, CELULAR (ejemplo 3001234567; se acepta +57 y espacios; deben quedar 10 dígitos que empiecen por 3), CORREO (OPCIONAL, formato válido si se escribe).
- Pie: "Total en persona" (suma de todos los servicios, mono 24 px), botón "Solicitar cita" (desactivado hasta tener servicio, hora, nombre y celular válidos) y texto "Sin pago en línea. El barbero aceptará o rechazará tu solicitud."
- Errores al enviar: 400 con el mensaje del campo; 409 "Ese horario ya no está disponible. Elige otro." (y recarga los horarios) o "Ya tienes una solicitud pendiente con este celular. Espera la respuesta del barbero." (según el mensaje de la API); 429 "Demasiados intentos. Intenta de nuevo en unos minutos."; barbero inexistente o con formato inválido: pantalla "No encontramos esta barbería" (mismo 404); barbero no activo: aviso "Las reservas no están disponibles por ahora." (usar `reservasDisponibles`).
- Éxito: guarda `{ token, codigo, creadoEn }` en el navegador (máximo 5) y navega a `/cita/:token`. Si el cliente vuelve a `/b/:codigo` con una cita activa guardada, ve arriba una franja "Tienes una cita pendiente · Ver estado".
- `/b` sin código: campo para escribir el código y botón "Continuar" que navega a `/b/{codigo}`.
- Endpoints: `GET /public/barberos/:codigo`, `GET /public/barberos/:codigo/disponibilidad?fecha=YYYY-MM-DD&duracionMinutos=N`, `POST /public/barberos/:codigo/citas` (forma del cuerpo en `docs/backend/PUBLICO_CREAR_CITA.md`).

### 6.11 Seguimiento (`/cita/:token`)
- Una sola pantalla que cambia según el estado efectivo que devuelve la API (`GET /public/citas/:token`, nunca trae datos personales). Muestra el mensaje legible de la API como texto principal.
- Estructura (la de "Cita creada"): ícono en círculo de 56 px con borde del color del estado, título, mensaje, filas Fecha, Hora, Servicios y "Total a pagar en persona", y el enlace de seguimiento recortado con botón "Copiar enlace". Botón "Cerrar" que lleva a `/b/{codigo}` (si no se conoce, a `/b`).
- Estados: pendiente (reloj, ámbar; título "Cita creada", "Tiene hasta 2 horas para responder"); aceptada (check, verde; "Cita confirmada"); rechazada (cruz, rojo; muestra el motivo); cancelada (cruz, rojo; motivo si lo hay); expirada (reloj, gris; "La solicitud expiró. Puedes pedir otra cita"); atendida (check, verde; "Gracias por venir"); no asistió (gris).
- Mientras esté `pendiente`, vuelve a consultar cada 30 segundos. Token inexistente: "No encontramos esta cita".

### 6.12 Panel de administración (dueño de la plataforma)
Diseño propio del panel, mismo estilo visual, pensado para móvil y escritorio.
- `/admin/login`: igual que el login del barbero pero con la marca y el texto "Administración", sin aviso de cuenta ni enlaces. Endpoint `POST /auth/login/admin`. Token de admin guardado aparte del de barbero. Errores como en el login del barbero.
- `/admin` (lista): título "Barberos", buscador (usuario o barbería), chips de filtro (Todos, Activos, Suspendidos, Vencidos), botón "+ Nuevo barbero". Cada fila: nombre de la barbería, usuario en mono y badge de estado (activo verde, suspendido ámbar, vencido rojo). Paginación con "Cargar más". Endpoint `GET /admin/barberos`.
- Sheet "Nuevo barbero": USUARIO (minúsculas, números, punto, guion y guion bajo; 3 a 50), CONTRASEÑA (8 a 72, con botón para mostrarla), y los campos de nombre, barbería y correo opcional que pida el backend (`docs/backend/ADMIN.md`). Tras crear: tarjeta "Entrega estos datos al barbero" con usuario, contraseña (se muestra una sola vez), código y link, y botón "Copiar mensaje" con un texto listo para pegar por WhatsApp.
- `/admin/barberos/:id` (detalle): datos del barbero, código y link con "Copiar"; control de estado Activo / Suspendido / Vencido (cambiar pide confirmación y explica el efecto: "No podrá iniciar sesión ni recibir reservas"); botón "Rotar código" con confirmación en rojo ("Los links ya compartidos dejarán de funcionar. Las citas existentes siguen funcionando"); botón "Restablecer contraseña" (sheet con campo nuevo, 8 a 72). Aviso: "Los tokens ya emitidos no se revocan; expiran por sí solos." Cierre de sesión del admin.
- Endpoints: `/admin/barberos` (crear, listar, detalle), `PATCH .../estado`, `POST .../rotar-codigo`, `POST .../restablecer-password`.

## 7. Datos, sesión y errores

- Todo dato de servidor pasa por hooks de consulta (TanStack Query); los componentes no llaman a `fetch`.
- Sesión del barbero en `localStorage` (clave propia), la del admin en otra clave. Una respuesta 401 cierra la sesión y lleva al login de su zona; 403 "Cuenta no activa" cierra la sesión con ese mensaje. El `barberoId` nunca se envía: sale del token.
- Refresco: al volver a la app (foco) y al cambiar de pestaña; Solicitudes y Hoy cada 60 s mientras estén visibles; también cuando el service worker avise de un push nuevo.
- Mensajes de error por código: 400 mensaje del campo; 401 sesión caducada; 403 sin permiso o cuenta no activa; 404 "No encontrado"; 409 el mensaje de la API; 429 "Demasiados intentos, espera un momento"; 5xx y sin red, "Algo salió mal. Inténtalo de nuevo." con botón "Reintentar".

## 8. PWA

- Nombre y nombre corto "KlippFlow", `lang` es-CO, `display: standalone`, orientación vertical, `theme_color` y `background_color` `#0D0D0E`.
- Íconos: 192 y 512, uno maskable (fondo `#121211`, logo al 70 % central) y el de iPhone de 180 con fondo sólido. Hasta que llegue el logo real se usa un ícono provisional claramente marcado.
- Meta de iOS: `apple-mobile-web-app-capable`, barra de estado translúcida negra, `viewport-fit=cover`.
- Service worker propio (precache de la app más manejo de `push` y `notificationclick`, que abre la URL del payload). El permiso de notificaciones se pide solo con un toque, dentro de la app instalada.

## 9. Pendientes conocidos

- Logo real del producto y los íconos de la PWA.
- Decidir si se aclara el color `--text-dim` por contraste.
- Backend: endpoint para que el barbero cambie su propia contraseña (hoy solo el admin la restablece).
- Verificado contra el backend: el horizonte es hoy + 7 días inclusive (8 fechas); las horas de hoy anteriores a `ahora + 30 min` se omiten de la disponibilidad; la API acepta entre 1 y 10 servicios por persona.
- El backend permite varios servicios por acompañante, aunque el copy original de 6.10 decía uno. La UI permite selección múltiple por acompañante, con máximo 10 por persona.
- `GET /public/citas/:token` no devuelve los servicios de la cita. El seguimiento omite la fila “Servicios” y muestra solo Fecha, Hora y Total, para no inventar campos.

### Discrepancias del Prompt 3 (Hoy y Solicitudes) frente a `docs/backend/`

- **6.3 contador "Libres":** el backend no expone ese conteo.
  `resumen` solo trae `citasHoy`, `aceptadas`, `atendidas`, `noAsistio` y
  `solicitudesPendientes`, y `huecosLibres` viene como arreglo de rangos (sin
  conteo ni minutos). Decisión del dueño (2026-10-30): se quita el contador
  "Libres" y se muestra **Atendidos** (`resumen.atendidas`). "Por atender" usa
  `resumen.aceptadas`.
- **6.3 "Hijo (8 años)":** el contrato no tiene edades. La línea de acompañantes
  muestra solo `personas[].nombre` (que puede ser `null`) y los servicios.
- **6.3 documento del DTO:** `BARBERO_SOLICITUDES_Y_DASHBOARD.md` escribe
  `"...": "resto del DTO de cita"` en el dashboard. Se usa el DTO documentado en
  la sección de solicitudes más `puedeMarcarNoAsistio` y `atencion`, sin añadir
  campos.
- **6.4 "refresca Hoy y Cuentas":** Cuentas todavía no existe. Se invalida
  `['barbero','balance','hoy']` (clave reservada) para que el prompt de Cuentas
  la consuma sin cambios.
- **6.5 "Avisar" tras no asistió:** el backend no devuelve `whatsappUrl` en
  `POST /barbero/citas/:id/no-asistio`. Ese toast no muestra el botón; solo
  aceptar, rechazar y cancelar lo muestran.
- **6.6 mensaje de expiración:** la API responde
  `Esta solicitud expiró (pasaron más de 2 horas)`; la UI lo normaliza a
  "Esta solicitud ya expiró" al aceptar o rechazar. Los demás 409 conservan el
  texto de la API.
- **7 mensaje 404:** el diseño pide "No encontrado" genérico; el backend
  distingue `Cita no encontrada` y `Atención no encontrada`. Se muestra el
  mensaje de la API.
- **Corrección de propina:** se valida contra `atenciones.fecha_balance`, no
  contra `citas.fecha`. El dashboard solo lista citas de hoy, así que la opción
  se ofrece siempre en la línea "Atendido" y, si el backend responde 409, se
  muestra su mensaje sin cambiar nada.

### Discrepancias del Prompt 4 (Cuentas y Compras) frente a `docs/backend/`

- **6.7 anticipos y devoluciones:** el diseño no los muestra y el backend los
  devuelve en `balance/hoy` y en el historial, pero en la Fase 1 **siempre valen
  0** ("existen pero valen 0 hasta la Fase 2"). Se ignoran en la UI.
- **6.7 contenido del balance:** el diseño dice "Servicios cobrados (+),
  Propinas (+), Compras de insumos (−, en rojo)". El backend confirma
  `ganancia_neta = total_servicios + total_propinas − total_compras`; los
  anticipos y devoluciones no entran en esa fórmula en la Fase 1.
- **6.7 lista de días:** el diseño no aclara si se muestran todos los días o solo
  los que tienen movimiento. La API devuelve **30 filas siempre** (hoy incluido,
  ceros para los días sin fila), así que la lista muestra los 29 días anteriores
  y solo cae al vacío "Aún no hay movimientos" cuando **todo** el historial está
  en cero.
- **6.7 / 6.8 totales:** el diseño no dice de dónde sale el total del día en
  Compras. Se usa el campo `total` que calcula el servidor, no una suma local.
- **6.8 409 de compras:** el diseño dice "se muestra el mensaje". El prompt de
  este paso fija el texto "Esta compra ya no se puede modificar", mientras el
  backend responde "Solo puedes modificar una compra el mismo día en que se
  registró" (y "…eliminar…" para el DELETE). Se usa el texto pedido en el prompt.
- **6.8 límite de la descripción:** el diseño dice "hasta 150 caracteres". No se
  usa `maxLength`: se deja escribir de más para poder explicar el límite y el
  formulario queda inválido por encima de 150.
- **6.8 `GET /barbero/compras`:** el diseño no menciona el filtro por fecha. La
  pantalla siempre consulta el día de Bogotá con `?fecha=` (el backend exige que
  esté dentro de los últimos 30 días y no sea futura).

### Discrepancias del Prompt 5 (Ajustes) frente a `docs/backend/`

- **6.9 "Compartir":** el diseño pide un botón "Compartir" que use el menú nativo
  del teléfono. Este prompt pide en su lugar "Ver como cliente" abriendo
  `/b/{codigo}` en pestaña nueva, así que se implementó eso.
- **6.9 "Ver desactivados":** el diseño propone un enlace discreto para ver los
  inactivos. El prompt pide mostrarlos siempre, atenuados y al final de la lista
  con la etiqueta "Inactivo". Se implementó lo del prompt.
- **6.9 guardado automático:** el diseño dice "guardado automático al cerrar el
  selector de hora"; el prompt exige guardado explícito por día. Se implementó un
  botón "Guardar" por día (con "Descartar") y los errores no pierden lo escrito.
- **6.9 "día activado":** el backend no tiene un booleano por día. El interruptor
  se deriva de los bloques (`activo`): apagarlo hace `PATCH { activo: false }` a
  los bloques (conserva las horas) y encender un día sin bloques crea 09:00–13:00.
  No se añadió ningún campo.
- **6.9 "Antes de cerrar, anula la suscripción push":** push queda fuera de este
  prompt. El punto de extensión `registrarAntesDeCerrarSesion` ya existe, pero
  aquí no se registra ninguna tarea.
- **6.9 eyebrow `{NOMBRE} · {BARBERÍA}`:** `nombreBarberia` es opcional en el
  contrato; si viene `null` el eyebrow muestra solo el nombre del barbero.
- **6.9 precio:** el diseño dice "PRECIO (entero)" sin máximo y `SERVICIOS.md`
  solo documenta `precio >= 1`. No se valida un tope superior (no se inventa).
- **§4 duración en servicios:** el diseño dice `90 min`; el prompt de este paso
  pide `1 h 15 min` / `45 min`. Se usa el texto del prompt en la lista de
  servicios.

### Discrepancias del Prompt 6 (onboarding y push) frente a `docs/backend/`

- **8 PWA "abre la URL del payload":** el payload real trae
  `url: "/solicitudes"` (`NOTIFICACIONES_PUSH.md` §41), pero esa ruta no existe en
  la app: la pantalla es `/app/solicitudes`. El service worker traduce esa ruta
  heredada, exige el mismo origen y cae a `/app/solicitudes` con cualquier URL
  externa.
- **Payload:** el diseño no describe el JSON. El backend envía
  `{ titulo, cuerpo, url }` (claves planas en español, sin `title`/`body`/`data`
  ni `icon`). El service worker usa el ícono de la PWA.
- **6.2 "Se muestra solo en iPhone fuera del modo instalado. En Android y
  escritorio no aparece":** el prompt pide mostrar la activación de
  notificaciones también en Android y escritorio (pantalla reducida, sin pasos de
  instalación). Se implementó lo del prompt.
- **6.2 "Hacerlo después":** el diseño solo dice que se guarda el descarte; el
  prompt fija que se vuelva a ofrecer a las 24 h y que no se ofrezca si el
  permiso ya está concedido o denegado.
- **6.9 "Enviar prueba":** no se implementó (`POST /barbero/push/probar` queda
  fuera de este prompt, que solo pide activar/desactivar).
- **6.9 "Fila Instalar en tu iPhone":** el enlace a la guía vive dentro de la
  tarjeta "Notificaciones" (estado "Requiere instalar la app") en lugar de ser una
  fila aparte.
- **Ruta del onboarding:** el prompt la llama `/app/instalar`; el mapa de rutas y
  el router usan `/instalar`. Se mantiene `/instalar` como canónica y se añadió
  `/app/instalar` como redirección.

### Diseño del panel de administración (definido en el Prompt 7)

No hay Figma para este panel: el diseño se fija aquí y se implementa con el mismo
sistema visual (tokens, tipografías y kit).

- **Contenedor:** `max-w-[900px]` centrado; usable a 390 px sin scroll
  horizontal. Barra superior del `AdminLayout` con "KlippFlow · Administración" y
  el nombre del admin.
- **`/admin/login`:** eyebrow "SOLO ADMINISTRADOR", título "Administración",
  logo provisional, Usuario y Contraseña (con ver/ocultar), "Entrar" y el error
  del backend. Sin enlaces a otras partes de la app.
- **`/admin`:** eyebrow "ADMINISTRACIÓN", título "Barberos", botón primario
  "+ Nuevo barbero" y "Cerrar sesión" discreto. Debajo, buscador y cuatro chips
  (Todos / Activos / Suspendidos / Vencidos) con su conteo, usando la variante
  `hueso` para el activo. Filas en tarjeta con nombre, barbería, `usuario ·
  código` en mono y píldora de estado. Skeleton al cargar, error con
  "Reintentar", "Aún no hay barberos" y "Sin resultados" con "Limpiar filtros".
- **Sheets:** el alta y el detalle son sheets (`Sheet` del kit, con foco
  atrapado, Esc y retorno del foco). Toda acción destructiva o de estado pasa por
  una confirmación explícita; ningún cambio se ejecuta con un solo toque.
- **Datos de una sola vez:** bloque con usuario, contraseña, código y link, cada
  uno con "Copiar", más "Copiar todo" (texto para WhatsApp) y el aviso "La
  contraseña solo se muestra ahora". El bloque se anuncia con
  `aria-live="polite"` al aparecer.
- **Estados:** píldora verde/ámbar/rojo con el texto siempre visible (el color
  nunca es la única señal), y una línea que explica el efecto del estado.

### Discrepancias del Prompt 7 frente a `docs/backend/`

- **6.12 "correo opcional":** `ADMIN.md` lo exige (`correo` es NOT NULL, email,
  máximo 150). El formulario lo marca obligatorio.
- **6.12 "campos de nombre":** el backend pide `nombres` y `apellidos` por
  separado (1–100 cada uno); el prompt hablaba de "Nombre" en singular. El sheet
  tiene los dos campos.
- **6.12 "paginación con Cargar más":** no se implementa. El panel pide 50 (el
  máximo del backend) para poder contar por estado y buscar por nombre, y avisa
  "Mostrando los primeros 50 de N" si hay más. El prompt de este paso no pedía
  paginación.
- **6.12 "contraseña se muestra una sola vez":** el backend no genera ni devuelve
  contraseñas; la escribe el panel. Se muestra una sola vez porque solo existe en
  el estado del sheet.
- **6.12 `/admin/barberos/:id`:** el prompt define el detalle como sheet, así que
  esa ruta ya no existe. El cierre de sesión está en la cabecera de la lista.
- **`PATCH /admin/barberos/:id/estado`:** `ADMIN.md` no documenta el cuerpo de la
  respuesta; la UI no lo usa y aplica el estado elegido tras el 200.
- **Orden de la lista:** el backend ordena por creación descendente; el panel
  reordena por nombre como pide el prompt (todo en cliente).