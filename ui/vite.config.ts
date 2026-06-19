import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
  define: {
    'import.meta.env.VITE_USE_MOCKS': JSON.stringify(process.env.VITE_USE_MOCKS ?? 'true'),
  },
  resolve: {
    alias: {
      leaflet: path.resolve(__dirname, 'node_modules/leaflet'),
    },
  },
  optimizeDeps: {
    include: ['leaflet', 'leaflet-rotatedmarker', 'leaflet-polylinedecorator'],
  },
  test: {
    exclude: ['node_modules', 'dist', '.git', '.cache', 'e2e'],
  },
})
