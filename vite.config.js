import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  base: '/eco-vision/',
  publicDir: 'public',
  optimizeDeps: {
    include: ['leaflet'],
  },
})