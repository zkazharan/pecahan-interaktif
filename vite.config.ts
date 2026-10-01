import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    svelte(),
    svelteTesting(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'script',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Pecahan Interaktif',
        short_name: 'Pecahan',
        description: 'Alat peraga pecahan untuk kelas 4–6',
        lang: 'id',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#fbf7ec',
        theme_color: '#fbf7ec',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test-setup.ts'],
  },
});
