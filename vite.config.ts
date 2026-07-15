import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        // Split the bundle so no single chunk trips Vite's 500 kB warning and
        // the rarely-changing vendor / data code caches independently of the
        // app shell. The two biggest data files (magic items, magic lores) get
        // their own chunks; the rest of the army data shares one. Everything is
        // still statically imported (no async, no behaviour change).
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
          if (id.includes('/src/data/magicItems')) return 'magic-items'
          if (id.includes('/src/data/lores')) return 'magic-lores'
          if (id.includes('/src/data/')) return 'army-data'
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
})
