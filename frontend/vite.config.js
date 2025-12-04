import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/data-profiling': 'http://localhost:8001',
      '/data-quality': 'http://localhost:8001',
      '/ai-analysis': 'http://localhost:8001',
      '/api': 'http://localhost:8001',
      '/health': 'http://localhost:8001'
    }
  }
})
