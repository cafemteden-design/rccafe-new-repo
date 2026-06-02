import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Hostinger-ready: base './' produces relative asset paths so the build works
// whether uploaded to public_html root, a subdomain root, OR a subfolder.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false
  },
  server: { port: 5173, open: true }
})
