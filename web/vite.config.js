import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // base relative ('./') pour le build embarqué dans l'app desktop Electron
  // (chargé via file://), absolu ('/') pour le déploiement web classique.
  base: process.env.VITE_ELECTRON ? './' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Permet à window.open('/api/...') et aux appels relatifs de fonctionner en dev
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
