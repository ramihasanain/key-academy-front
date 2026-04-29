import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    alias: {
      'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf.mjs',
    }
  },
  server: {
    port: 5173,
    open: true
  }
})
