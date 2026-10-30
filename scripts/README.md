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
4. Actualizar `src/shared/ui/LogoKlippFlow.tsx` para usar
   `/logo-klippflow.svg` en lugar del círculo provisional.
5. Revisar que `public/manifest.webmanifest` (generado) siga apuntando a los
   cuatro archivos y que Chrome no reporte errores de instalación.

No se debe agregar una dependencia de generación de imágenes sin acordarlo.
