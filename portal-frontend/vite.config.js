import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    host: true,
    allowedHosts: [
      'wipe-harvest-zone.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app',
      'localhost',
      '127.0.0.1'
    ],
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5174,
    host: true,
    allowedHosts: [
      'wipe-harvest-zone.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app',
      'localhost',
      '127.0.0.1'
    ],
    cors: true
  }
})
