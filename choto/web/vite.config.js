import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the Express server (port 3000) handles the API.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
