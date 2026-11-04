import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The gateway CORS only accepts http://localhost:3000, so the port is fixed:
// strictPort makes Vite fail instead of silently moving to 3001.
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
});
