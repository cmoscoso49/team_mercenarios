import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      // Copia .htaccess al dist (Vite ignora dotfiles por defecto)
      name: 'copy-htaccess',
      closeBundle() {
        try {
          copyFileSync(
            resolve(__dirname, 'public/.htaccess'),
            resolve(__dirname, 'dist/.htaccess')
          )
        } catch {}
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
})
