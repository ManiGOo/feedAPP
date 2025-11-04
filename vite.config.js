// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: process.env.NODE_ENV === 'development'
      ? {
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true,
            secure: false,
          },
        }
      : undefined,
  },
  define: {
    // Optional: Expose API URL to frontend (alternative to .env)
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'http://localhost:5000'
    ),
  },
});