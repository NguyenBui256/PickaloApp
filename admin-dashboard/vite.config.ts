import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Allow access from Docker network
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://backend:8000', // Use Docker service name
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
        preserveHeaderKeyCase: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Log the original request headers for debugging
            if (req.headers.authorization) {
              console.log('Forwarding Authorization header:', req.headers.authorization.substring(0, 20) + '...');
            }
          });
        },
      },
    },
  },
})
