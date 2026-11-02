import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => ({
  // Project Pages are served under /HyperPolyGlot-SOS-/ rather than the domain root.
  base: process.env.GITHUB_PAGES === 'true' ? '/HyperPolyGlot-SOS-/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'maskable-icon.png'],
      manifest: {
        name: 'HyperPolyglot Sovereign OS',
        short_name: 'SOS',
        description: 'Sovereign Multi-Device Remote Management & Visualization System',
        theme_color: '#02050b',
        background_color: '#02050b',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname || '.', '.'),
    },
  },
  server: {
    hmr: false,
    watch: null,
  },
}));
