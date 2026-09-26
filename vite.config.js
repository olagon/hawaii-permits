import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: 'app',
  base: process.env.ALA_BASE || '/ala/',
  publicDir: 'public',
  build: { outDir: '../dist', emptyOutDir: true, sourcemap: false },
  worker: { format: 'es' },
  server: { port: 5173 },
  preview: { port: 4173 },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Ala: Hawaiʻi outdoor permits',
        short_name: 'Ala',
        description: 'Which permits, licenses, and reservations you need to hike, camp, hunt, fish, or visit outdoor places in Hawaiʻi.',
        theme_color: '#0f5132',
        background_color: '#f6f8f6',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        globIgnores: ['data/alerts.json', 'data/ridb-facilities.json', 'tiles/*'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
        runtimeCaching: [
          { urlPattern: /^https:\/\/tiles\.openfreemap\.org\/.*/i, handler: 'CacheFirst', options: { cacheName: 'map-tiles', expiration: { maxEntries: 3000, maxAgeSeconds: 30 * 86400 }, cacheableResponse: { statuses: [0, 200] } } },
          { urlPattern: /\/data\/alerts\.json$/, handler: 'NetworkFirst', options: { cacheName: 'alerts', networkTimeoutSeconds: 5 } },
          { urlPattern: /\/data\/manifest\.json$/, handler: 'NetworkFirst', options: { cacheName: 'manifest', networkTimeoutSeconds: 5 } },
        ],
      },
    }),
  ],
});
