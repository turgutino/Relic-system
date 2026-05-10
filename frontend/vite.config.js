import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/relics/export': 'http://127.0.0.1:8000',
      '/relics/search/advanced': 'http://127.0.0.1:8000',
      '/relics': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
      '/stats': 'http://127.0.0.1:8000',
      '/timeline': 'http://127.0.0.1:8000',
      '/museums/geo': 'http://127.0.0.1:8000',
      '/museums': 'http://127.0.0.1:8000',
    },
  },
});
