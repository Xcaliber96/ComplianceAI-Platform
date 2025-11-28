import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: true,
    port: 8501,

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

    allowedHosts: [
      'localhost',
      'complianceai-platform.onrender.com',
      'complianceai-platform-1.onrender.com',
      'nomioc.com',
      'api.nomioc.com',
    ],
  },

  preview: {
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
