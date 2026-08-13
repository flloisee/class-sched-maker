import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/class-sched-maker/',
  server: {
    allowedHosts: ['harmonics-preamble-occupancy.ngrok-free.dev'],
  },
})
