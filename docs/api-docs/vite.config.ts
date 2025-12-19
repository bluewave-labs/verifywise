import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@user-guide-content': path.resolve(__dirname, '../../shared/user-guide-content'),
    },
    dedupe: ['lucide-react'],
  },
  optimizeDeps: {
    include: ['lucide-react'],
  },
  server: {
    port: 5173,
  },
});
