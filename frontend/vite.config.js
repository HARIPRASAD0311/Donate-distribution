import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
    // Mitigation for GHSA-67mh-4wv8-2f99 (esbuild <=0.24.2 dev-server CORS issue):
    // Restrict the dev server to localhost only so external origins cannot
    // reach the HMR websocket or dev-server endpoints.
    // Do NOT set host: true or host: '0.0.0.0' in development unless
    // network access is explicitly required and the environment is trusted.
    host: '127.0.0.1',
    cors: false,
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand', '@tanstack/react-query'],
          recharts: ['recharts'],
          leaflet: ['leaflet', 'react-leaflet'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
