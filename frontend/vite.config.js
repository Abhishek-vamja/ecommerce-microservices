import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
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
  },
  preview: {
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

