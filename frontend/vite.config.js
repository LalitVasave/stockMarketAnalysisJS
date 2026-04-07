import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
    proxy: {
      // Proxy /api HTTP calls to the Express backend on port 3000
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      },
      // NOTE: WebSocket is NOT proxied here — Vite's own HMR uses WS on this port.
      // The React app connects to the backend WebSocket directly on ws://localhost:3000.
    },
  },
})
