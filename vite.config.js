import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Absolute root asset paths keep React Router deep links such as
// /rewards/card/demo and /staff/rewards working on Vercel/static hosts.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-motion': ['framer-motion']
        }
      }
    }
  },
  server: { port: 5173, open: true }
})
