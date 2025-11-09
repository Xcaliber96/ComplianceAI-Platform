import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 8501,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/add_user_to_gcs': {
        target: 'http://localhost:8000',
        
        changeOrigin: true,
      },
    },
    allowedHosts: [
      'complianceai-platform.onrender.com',
      'complianceai-platform-1.onrender.com',
    ],
  },
  preview: {
    allowedHosts: [
      'complianceai-platform.onrender.com',
      'complianceai-platform-1.onrender.com',
      'nomioc.com',
      'www.nomioc.com',
    ],
    port: 8501,
  },
  build: {
    outDir: 'dist',
  },
})
