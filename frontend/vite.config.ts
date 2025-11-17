import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  server: {
    host: true,
    port: 8501,

    // 👇 Proxy only used in local development
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/session': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/add_user_to_gcs': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },

    // 👇 Allow Render and localhost domains to access during dev
    allowedHosts: [
      'localhost',
      'complianceai-platform.onrender.com',
      'complianceai-platform-1.onrender.com',
      'nomioc.com',
      'api.nomioc.com',
    ],
  },

  preview: {
    // 👇 When previewing a production build locally (vite preview)
    port: 8501,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'nomioc.com',
      'api.nomioc.com',
      'www.nomioc.com',
      'complianceai-platform.onrender.com',
      'complianceai-platform-1.onrender.com',
    ],
  },

  build: {
    outDir: 'dist',
  },
}))
