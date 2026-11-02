import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        // logo-1024.png no se usa (el logo de la UI es el de 512): fuera del
        // precache para no inflar la instalación.
        globIgnores: ['**/logo-1024.png'],
      },
      // Service worker también en desarrollo (módulo) para poder probar push en
      // localhost. El precache se omite allí porque el manifiesto viene vacío.
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'KlippFlow',
        short_name: 'KlippFlow',
        description:
          'Agenda, caja y avisos para barberos. Tus clientes reservan sin crear cuenta.',
        lang: 'es-CO',
        start_url: '/app',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        // #0D0D0E = --bg de src/styles/tokens.css (theme-color de la PWA).
        theme_color: '#0D0D0E',
        background_color: '#0D0D0E',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3001,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
})
