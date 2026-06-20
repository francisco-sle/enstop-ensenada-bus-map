import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file variables based on the current mode in the current workspace directory.
  const env = loadEnv(mode, process.cwd(), '')
  const useMocks = process.env.VITE_USE_MOCKS ?? env.VITE_USE_MOCKS ?? 'false'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
    },
    define: {
      'import.meta.env.VITE_USE_MOCKS': JSON.stringify(useMocks),
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
  }
})
