# Passkeys (WebAuthn) para clientes

El cliente registra una passkey desde su dispositivo y luego inicia sesión con
huella, rostro o PIN **sin escribir usuario**. Solo aplica a clientes (no
barberos ni admin).

> El flujo REAL de crear/usar una passkey **no se puede probar en Thunder
> Client**: requiere un autenticador (Touch ID, Windows Hello, huella del
> teléfono). Eso se valida con el frontend en un dispositivo. Con HTTP solo se
> prueban los caminos negativos y de seguridad.

---

## Endpoints

### Cliente (JWT, `@Roles('cliente')`, 10/min)

| Método | Ruta | Respuesta |
|---|---|---|
| `POST` | `/cliente/passkeys/registro/opciones` | `200 { opciones, desafioToken }` |
| `POST` | `/cliente/passkeys/registro/verificar` | `201 { id, nombre }` |
| `GET` | `/cliente/passkeys` | `200 [{ id, nombre, tipoDispositivo, respaldada, creadaEn, ultimoUsoEn }]` |
| `DELETE` | `/cliente/passkeys/:id` | `204`; ajena o inexistente → `404` |

Reglas:
- Máximo **5 passkeys por cliente** (en opciones o al crear → `409`).
- `credential_id` repetido → `409`.
- `nombre` por defecto `Mi dispositivo` (máx. 60, trim).
- El listado **nunca** devuelve `credential_id` ni `public_key`.
- Si el cliente ya tiene passkeys, todas comparten el mismo `user_handle`
  (aleatorio de 32 bytes base64url, nunca el id ni el username).

### Públicos (10/min)

| Método | Ruta | Respuesta |
|---|---|---|
| `POST` | `/auth/passkey/opciones` | `200 { opciones, desafioToken }` |
| `POST` | `/auth/passkey/verificar` | `200 { accessToken, tipo:'cliente', cliente }` |

Login **descubrible**: `opciones` no lleva `allowCredentials`. Cualquier fallo
de verificación o credencial desconocida responde el mismo
`401 { message: 'No se pudo iniciar sesión con la passkey' }`. Cliente
desactivado → `403` **después** de verificar. El JWT se emite con
`metodo: 'passkey'`.

---

## Contrato exacto para el frontend

`opciones` es **exactamente** la salida de
`generateRegistrationOptions` / `generateAuthenticationOptions` de
`@simplewebauthn/server` (`PublicKeyCredentialCreationOptionsJSON` /
`PublicKeyCredentialRequestOptionsJSON`). Se pasa a
`startRegistration(opciones)` / `startAuthentication(opciones)` de
`@simplewebauthn/browser`.

`respuesta` es **exactamente** lo que devuelven esas funciones, sin modificar
(no convertir ArrayBuffers a mano; `startRegistration` ya devuelve JSON
base64url).

Flujo:

```text
1. (registro) POST /cliente/passkeys/registro/opciones  -> { opciones, desafioToken }
2. const respuesta = await startRegistration({ optionsJSON: opciones })
3. POST /cliente/passkeys/registro/verificar { desafioToken, respuesta, nombre? }

Login:
1. POST /auth/passkey/opciones -> { opciones, desafioToken }
2. const respuesta = await startAuthentication({ optionsJSON: opciones })
3. POST /auth/passkey/verificar { desafioToken, respuesta } -> accessToken
```

El `desafioToken` es un JWT de 5 min, de **un solo uso**, con
`{ tipo: 'webauthn_registro' | 'webauthn_login', challenge, jti, clienteId? }`.
No sirve como token de sesión: `JwtStrategy`/`JwtAuthGuard` lo rechazan.

---

## Variables de entorno

```env
WEBAUTHN_RP_ID=localhost                  # en prod: klippflow.vercel.app
WEBAUTHN_RP_NAME=KlippFlow                # opcional (default KlippFlow)
WEBAUTHN_ORIGINS=http://localhost:3001    # prod: https://klippflow.vercel.app
```

`WEBAUTHN_ORIGINS` acepta una lista separada por comas (por ejemplo desarrollo
y producción a la vez). Se leen de forma **perezosa**: si faltan, la app
arranca y los endpoints de passkeys responden `503 Passkeys no configuradas`.

---

## Limitaciones

- **Las passkeys quedan atadas al RP ID.** Si cambias de dominio
  (`WEBAUTHN_RP_ID`) las passkeys existentes dejan de servir para ese dominio;
  el cliente debe registrarlas de nuevo. Definir el dominio final antes de
  producción.
- El `Map` de `jti` usados y los desafíos viven en **memoria de una instancia**.
  Con varias instancias o reinicios, un desafío emitido en una instancia puede
  no reconocerse en otra. Para producción multi-instancia usar Redis o un
  almacén compartido.
- El `desafioToken` caduca a los 5 min; el cliente debe reenviarlo tal cual.

---

## Códigos rápidos

| Código | Caso |
|---|---|
| `401` | desafío vencido/alterado/reusado, otro cliente, credencial desconocida, verificación fallida |
| `403` | token de barbero en endpoints de cliente; cliente desactivado al iniciar sesión |
| `404` | passkey ajena o inexistente al borrar |
| `409` | 5 passkeys o `credential_id` repetido |
| `503` | faltan `WEBAUTHN_RP_ID` / `WEBAUTHN_ORIGINS` |
