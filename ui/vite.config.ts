import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Default to mock data if VITE_USE_MOCKS is not explicitly defined in the environment.
if (process.env.VITE_USE_MOCKS === undefined) {
  process.env.VITE_USE_MOCKS = 'true'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    exclude: ['node_modules', 'dist', '.git', '.cache', 'e2e']
  }
})
