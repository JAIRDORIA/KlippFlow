# WhatsApp — base (paso A)

> Estado: **paso A completo**. Deja listo el envío de plantillas detrás de un
> puerto, el esquema de `recordatorios` y el consentimiento de barbero y
> cliente. **No** hay programación de recordatorios, jobs ni webhook (pasos B y
> C) y **ningún caso de uso envía mensajes todavía**.

---

## 1. Reglas de negocio

1. **Solo plantillas aprobadas por Meta.** Los recordatorios son mensajes
   iniciados por el negocio; la API de Meta no permite texto libre fuera de la
   ventana de 24 h. El puerto solo expone `enviarPlantilla`.
2. **Un solo número emisor** para toda la plataforma
   (`WHATSAPP_PHONE_NUMBER_ID`). Los barberos no conectan su propia cuenta.
3. **Destinatarios:**
   - **cliente** → celular de la cita (`citas.invitado_celular`, 10 dígitos).
   - **barbero** → su propio celular (`barberos.celular`).
4. **Consentimiento:**
   - Cliente: solo recibe si marcó `aceptaWhatsapp: true` al reservar
     (`citas.acepta_whatsapp = 1`). Por defecto **NO**.
   - Barbero: activa o desactiva el suyo (`barberos.whatsapp_activo`).
     Por defecto **NO**.
5. **Celular colombiano normalizado** a 10 dígitos (`/^3\d{9}$/`) con
   `normalizarCelularColombia` (acepta `+57` y espacios). A Meta se envía como
   `57` + 10 dígitos, **sin `+`**.

---

## 2. Variables de entorno

| Variable | Cuándo es obligatoria | Ejemplo |
|---|---|---|
| `WHATSAPP_ENABLED` | siempre (opcional; por defecto `false`) | `false` \| `true` |
| `WHATSAPP_API_VERSION` | `WHATSAPP_ENABLED=true` | `v23.0` |
| `WHATSAPP_PHONE_NUMBER_ID` | `WHATSAPP_ENABLED=true` | `1434185513111525` |
| `WHATSAPP_TOKEN` | `WHATSAPP_ENABLED=true` | token de Meta (**secreto**) |
| `WHATSAPP_TEMPLATE_LANG` | `WHATSAPP_ENABLED=true` | `es_CO` (idioma por defecto de las plantillas) |

- Con `WHATSAPP_ENABLED=false` **no se exige ninguna** de las otras cuatro: la
  app arranca con el adaptador simulado.
- Con `WHATSAPP_ENABLED=true` el `WhatsappModule` llama a
  `configService.getOrThrow` para las cuatro y la app **no arranca** si falta
  alguna (es preferible a fallar en el primer envío).
- El token **nunca** se loguea ni se devuelve por la API.
- **Idioma por plantilla:** `enviarPlantilla` acepta `idioma?`. Si la plantilla
  lo declara (hoy `aceptacion_de_cita` usa `en` porque así existe en Meta),
  tiene prioridad sobre `WHATSAPP_TEMPLATE_LANG`; si no, se usa la variable.
  Ver `src/modules/recordatorios/application/plantillas-whatsapp.ts`.

---

## 3. Puerto y adaptadores

```
src/shared/
├── ports/whatsapp.port.ts                 # WHATSAPP_PORT + tipos
├── whatsapp.module.ts                     # elige adaptador con useFactory
└── infrastructure/
    ├── whatsapp-cloud-api.adapter.ts      # Meta Cloud API (fetch nativo)
    └── whatsapp-desactivado.adapter.ts    # simulado (WHATSAPP_ENABLED=false)
```

```ts
export type ResultadoEnvioWhatsapp =
  | { ok: true; wamid: string }
  | { ok: false; error: string; permanente: boolean };

export interface WhatsappPort {
  enviarPlantilla(envio: {
    celular: string;       // 10 dígitos, sin +57
    plantilla: string;     // nombre de la plantilla aprobada
    idioma?: string;       // si falta, se usa WHATSAPP_TEMPLATE_LANG
    encabezado?: string[]; // variables del HEADER, en orden
    cuerpo?: string[];     // variables del BODY, en orden
  }): Promise<ResultadoEnvioWhatsapp>;

  // Paso C: solo para RESPONDER dentro de la ventana de 24 h.
  enviarTexto(envio: {
    celular: string;
    texto: string;
  }): Promise<ResultadoEnvioWhatsapp>;
}
```

`enviarPlantilla` **nunca lanza**: todo error vuelve en el resultado. El
dominio y los casos de uso solo importan el puerto (`import type` para los tipos
y el `Symbol` aparte, convención 6 del proyecto); nunca `fetch` ni nada de Meta.

> **Cambio del paso B:** el campo `parametros` del paso A se reemplazó por
> `encabezado` y `cuerpo`. Cada componente de una plantilla numera sus variables
> desde `{{1}}`, por eso van en dos arreglos separados y el encabezado se envía
> primero.
>
> **Cambio del paso C:** se agregó `enviarTexto({ celular, texto })` (payload
> `{ type: 'text', text: { body, preview_url: false } }`) para responder a un
> mensaje del usuario dentro de la ventana de 24 h. Los recordatorios siguen
> usando plantillas. Ver `docs/WHATSAPP_WEBHOOK.md`.

### Adaptador real — `WhatsappCloudApiAdapter`

```
POST https://graph.facebook.com/{WHATSAPP_API_VERSION}/{WHATSAPP_PHONE_NUMBER_ID}/messages
Authorization: Bearer {WHATSAPP_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "57<celular>",
  "type": "template",
  "template": {
    "name": "<plantilla>",
    "language": { "code": "<WHATSAPP_TEMPLATE_LANG>" },
    "components": [
      { "type": "header", "parameters": [{ "type": "text", "text": "..." }] },
      { "type": "body",   "parameters": [{ "type": "text", "text": "..." }] }
    ]
  }
}
```

- El componente `header` se agrega **solo** si `encabezado` trae valores, y va
  **antes** que el `body`. El `body` se agrega solo si `cuerpo` trae valores.
- `components` **no se envía** si ambos están vacíos (las plantillas sin
  variables lo rechazan).
- Timeout de **10 s** con `AbortController`.
- Los logs usan el celular enmascarado (`300***4567`); nunca el token ni el
  número completo.

### Adaptador simulado — `WhatsappDesactivadoAdapter`

No llama a Meta. Loguea plantilla y celular enmascarado y devuelve
`{ ok: true, wamid: 'simulado-<timestamp>' }`. Sirve para desarrollar los pasos
B y C sin credenciales ni costo por mensaje.

---

## 4. Criterio de errores permanentes

`permanente = true` significa **no reintentar**: el mensaje queda `fallido`.

| Situación | HTTP | `error.code` de Meta | `permanente` |
|---|---|---|---|
| Timeout (10 s) / caída de red | — | — | `false` |
| Caída de Meta | 5xx | cualquiera | `false` |
| Límite de tasa | 429 o 4xx | `4`, `80007`, `131048`, `131056` | `false` |
| Servicio no disponible / desconocido | 4xx | `1`, `2`, `131000`, `131016`, `131057` | `false` |
| Número inválido o que no puede recibir | 400 | `131026`, `131030` | `true` |
| Plantilla inexistente o no aprobada | 400 | `132001`, `132005`, `132007`, `132015`, `132016`, `132068`, `132069` | `true` |
| Parámetros incorrectos | 400 | `132000`, `132012` | `true` |
| Token / parámetro / cuenta inválidos | 400, 401, 403 | `100`, `190`, `131031`, `131051` | `true` |
| Otro 4xx no listado | 400–499 | cualquiera | `true` |
| Cualquier otro caso | — | — | `false` (ante la duda se reintenta) |

El orden del algoritmo está documentado en
`whatsapp-cloud-api.adapter.ts` (`esPermanente`): 429/5xx → transitorio;
código transitorio → transitorio; código permanente → permanente; otro 4xx →
permanente; resto → transitorio.

---

## 5. Esquema (migración 010)

`database/migrations/010_whatsapp_base.sql` (ejecutar a mano):

- `barberos.celular` `VARCHAR(10) NULL`
- `barberos.whatsapp_activo` `TINYINT(1) NOT NULL DEFAULT 0`
- `citas.acepta_whatsapp` `TINYINT(1) NOT NULL DEFAULT 0`
- Tabla `recordatorios`:

| Columna | Tipo | Nota |
|---|---|---|
| `id` | `BIGINT UNSIGNED` PK AI | |
| `cita_id` | `INT UNSIGNED` NOT NULL | FK `citas(id)` `ON DELETE CASCADE` |
| `destinatario` | ENUM(`cliente`,`barbero`) | |
| `tipo` | ENUM(`recordatorio_24h`,`recordatorio_2h`,`recordatorio_barbero`,`aceptacion`) | |
| `programado_para` | `DATETIME` NOT NULL | hora local del negocio |
| `estado` | ENUM(`pendiente`,`procesando`,`enviado`,`fallido`,`cancelado`,`omitido`) | default `pendiente` |
| `intentos` | `TINYINT UNSIGNED` | default 0 |
| `wamid` | `VARCHAR(100) NULL` | id de Meta |
| `error` | `VARCHAR(255) NULL` | último error (recortado) |
| `enviado_en` | `DATETIME NULL` | |
| `creado_en` / `updated_at` | `TIMESTAMP` | |

Índices: `UNIQUE (cita_id, tipo)` para idempotencia e
`INDEX (estado, programado_para)` para el barrido del job.

**Migración 011 (paso C)** agrega `recordatorios.entregado_en` y
`recordatorios.leido_en` (DATETIME NULL) + `INDEX (wamid)`, la tabla
`whatsapp_bajas`, la tabla `whatsapp_mensajes_entrantes` y
`citas.confirmada_cliente_en`. Ver `docs/WHATSAPP_WEBHOOK.md`.

`synchronize: false` sigue vigente: el esquema **no** se toca desde el código.

---

## 6. Consentimiento

### 6.1 Barbero

`PUT /barbero/configuracion/whatsapp` (JWT de barbero, `barberoId` del token):

```json
{ "celular": "+57 300 111 2233", "activo": true }
```

Respuesta `200`:

```json
{ "whatsapp": { "celular": "3001112233", "activo": true } }
```

- `activo: true` exige un celular válido **en la misma petición**; si falta o
  no normaliza a 10 dígitos → `400`.
- `activo: false` sin `celular` solo apaga el flag y conserva el número.
- `barberoId` en el body → `400` (whitelist del `ValidationPipe` global).
- Sin JWT → `401`.

`GET /barbero/configuracion` ahora incluye además:

```json
{
  "codigoUnico": "BARB-0001",
  "linkReservas": "https://app/b/BARB-0001",
  "whatsapp": { "celular": "3001112233", "activo": true }
}
```

### 6.2 Cliente

El opt-in se captura al reservar, en el body de
`POST /cliente/barberos/:codigo/citas`:

```json
{ "fecha": "2026-11-20", "horaInicio": "09:00", "personas": [{ "servicioIds": [1] }], "aceptaWhatsapp": true }
```

- Campo **opcional** y **por defecto `false`**, se guarda en
  `citas.acepta_whatsapp`.
- Un valor no booleano (ej. `"si"`) → `400`.
- El resto del contrato no cambia.

> **Desviación del prompt original:** el prompt pedía agregar el campo en
> `POST /public/barberos/:codigo/citas`, pero esa reserva anónima está
> **retirada** (responde `410 Gone` desde las cuentas de cliente). La reserva
> real es `POST /cliente/barberos/:codigo/citas` y reutiliza el mismo
> `CrearCitaPublicaUseCase`. El campo se agregó también al
> `CrearCitaPublicaDto` compartido, así que si algún día se restaurara el
> endpoint público ya lo aceptaría.

---

## 7. Scripts y pruebas

- `node scripts/probar-whatsapp.js <celular>`: envía `hello_world` (`en_US`,
  sin parámetros) con las variables del `.env` e imprime el JSON de Meta **sin
  el token**. Es solo para comprobar credenciales; no forma parte de la app. El
  número debe estar verificado como destinatario en el panel de Meta.
- Pruebas jest:
  - `src/shared/infrastructure/whatsapp-cloud-api.adapter.spec.ts`: payload
    exacto con y sin parámetros, prefijo `57`, clasificación
    permanente/transitoria, 429/5xx, error de red y timeout de 10 s.
  - `src/shared/infrastructure/whatsapp-desactivado.adapter.spec.ts`: no llama
    a Meta, wamid simulado y log enmascarado.
  - `src/shared/domain/celular.util.spec.ts`: normalización y enmascarado.

---

## 8. Estado de los pasos

- **Paso A (este documento):** puerto, adaptadores, migración y consentimiento.
  ✅
- **Paso B:** programación, cancelación y job de envío. ✅ Ver
  `docs/RECORDATORIOS_WHATSAPP.md`.
- **Paso C:** webhook de Meta (firma, estados de entrega,
  botones CONFIRMAR/CANCELAR, bajas y texto libre de respuesta) y
  re-consentimiento al reservar. ✅ Ver `docs/WHATSAPP_WEBHOOK.md`.
  **No** incluye reprogramación de citas ni frontend.
