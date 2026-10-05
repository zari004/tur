import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        panel: path.resolve(__dirname, 'panel/index.html'),
        admin: path.resolve(__dirname, 'admin/index.html'),
        auth: path.resolve(__dirname, 'auth/index.html'),
      },
    },
  },
});
