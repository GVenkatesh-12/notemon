import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://secure-notes-api-u4ve.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        timeout: 60000,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const len = proxyReq.getHeader('content-length') || 0;
            console.log(`[Proxy →] ${req.method} ${req.url} (${len} bytes)`);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`[Proxy ←] ${req.method} ${req.url} → ${proxyRes.statusCode}`);
          });
          proxy.on('error', (err, req) => {
            console.error(`[Proxy ERROR] ${req.method} ${req.url}:`, err.message);
          });
        },
      },
    },
  },
})
