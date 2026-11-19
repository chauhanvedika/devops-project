import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // In dev, forward /api to the locally running backend (same behaviour as nginx in prod)
    proxy: { '/api': 'http://localhost:5000' },
  },
});
