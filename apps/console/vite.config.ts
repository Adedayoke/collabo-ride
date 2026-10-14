import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The console runs on the same origin as the API in production (Caddy).
// In development the dev server proxies the API and the socket to the services.
export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
  server: {
    port: 5173,
    proxy: {
      '/v1': 'http://localhost:8080',
      '/socket.io': { target: 'http://localhost:8086', ws: true },
    },
  },
})
