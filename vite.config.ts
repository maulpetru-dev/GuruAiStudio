import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR === 'true'
        ? false
        : {
            clientPort: 443,
          },
      watch: process.env.DISABLE_HMR === 'true'
        ? null
        : {
            ignored: ['**/.git/**', '**/node_modules/**', '**/dist/**'],
          },
    },
  };
});

