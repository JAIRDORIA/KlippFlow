# Scripts

## `generate-icons.mjs`

Genera los íconos **provisionales** de la PWA en `public/icons/`:

```bash
pnpm icons
```

Salida:

- `icon-192.png` (192×192, purpose `any`)
- `icon-512.png` (512×512, purpose `any`)
- `maskable-512.png` (512×512, purpose `maskable`)
- `apple-touch-icon-180.png` (180×180, para iOS)

El script no usa red ni dependencias externas: dibuja un fondo `#121211` con
una “K” hueso y escribe PNG con `node:zlib`. Esos colores coinciden con los
tokens `--logo-background` y `--accent`.

### Cuando exista el logo real

1. Guardar el master aprobado como `public/logo-klippflow.svg` (o el PNG que
   entregue diseño). Esa es también la ruta documentada por
   `LogoKlippFlow`.
2. Exportar los tamaños 192, 512, maskable 512 y 180 desde el master. Para
   maskable, mantener el logo dentro del 70 % central y fondo sólido `#121211`.
3. Reemplazar el dibujo de la “K” de `generate-icons.mjs` por la lectura del
   master (por ejemplo con `sharp`, si se decide agregarlo como dependencia de
   desarrollo) y volver a ejecutar `pnpm icons`.
4. Actualizar `src/shared/ui/Logo.tsx` para usar el archivo real con la ruta
   absoluta `/icons/...` (nunca relativa: en `/b/CODIGO` se resolvería contra
   `/b/`).
5. Revisar que `public/manifest.webmanifest` (generado) siga apuntando a los
   cuatro archivos y que Chrome no reporte errores de instalación.

`sharp` está como `devDependency` solo para `generar-badge.mjs`; no se usa en la
app ni en el build.

## `generar-badge.mjs`

Genera el badge monocromático de las notificaciones push:

```bash
pnpm badge
```

- Salida: `public/icons/badge-96.png` (96×96, RGBA).
- RGB blanco puro y la forma del logo en el canal alfa, con fondo transparente y
  ~10 % de margen interno.
- Android usa el alfa como máscara; **un PNG a color con fondo opaco se ve como
  un cuadrado blanco**.
- Fuente: `public/icons/logo-512.png`. Si tiene fondo transparente usa su alfa;
  si fuera opaco, deriva el alfa de la luminosidad (oscuro = visible).
- Es idempotente: se puede volver a ejecutar cuando cambie el logo real.

