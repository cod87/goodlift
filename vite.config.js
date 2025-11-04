import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/goodlift/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code (React, MUI, etc.) into separate chunk
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          // Split Material-UI into separate chunk
          mui: [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
          ],
          // Split charting libraries
          charts: [
            'chart.js',
            'react-chartjs-2',
          ],
          // Split Firebase
          firebase: [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage',
          ],
        },
      },
    },
    // Increase chunk size warning limit since we're splitting properly
    chunkSizeWarningLimit: 600,
  },
})
