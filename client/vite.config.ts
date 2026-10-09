import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // MUI + React + Emotion form the ~600 kB main chunk; Recharts is split into the admin chunk.
  build: { chunkSizeWarningLimit: 700 },
  server: {
    port: 5173,
    // The API (and its SSE streams) is proxied so the browser sees one origin.
    proxy: { '/api': { target: process.env.API_URL ?? 'http://localhost:4000', changeOrigin: true } },
  },
});
