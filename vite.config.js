import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Exposes on local network IP (0.0.0.0)
    port: 3000,
    open: false
  }
});
