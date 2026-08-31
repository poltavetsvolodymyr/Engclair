/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// `base` must match the GitHub Pages sub-path: https://<user>.github.io/Engclair/
export default defineConfig({
  base: '/Engclair/',
  plugins: [
    react(),
    // Installable, and usable with no network at all: the deck ships inside
    // the bundle and progress lives in localStorage, so a precached shell is
    // the whole app. Icons come from scripts/generate-icons.py.
    VitePWA({
      // No "update available" prompt to build or translate: a new service
      // worker takes over on the next visit. Grades are persisted as they are
      // given, so nothing is lost if a reload lands mid-session.
      registerType: 'autoUpdate',
      // Injects the registration snippet into index.html, keeping the
      // bootstrap in main.tsx free of service-worker plumbing.
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      // `start_url` and `scope` are left to the plugin, which derives them
      // from `base` above — spelling them out here would duplicate the path.
      manifest: {
        name: 'Engclair — English vocabulary and phrasal verbs',
        short_name: 'Engclair',
        description:
          'Learn English vocabulary and phrasal verbs with spaced repetition.',
        lang: 'en',
        categories: ['education'],
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf6ef',
        theme_color: '#faf6ef',
        icons: [
          // Relative to the manifest, which sits at the base path.
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Recorded clips are part of the shell: without them here, offline
        // pronunciation would silently fall back to the synthesiser.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,m4a,mp3,wav}'],
        // Single-page app: any in-scope navigation is served the shell.
        navigateFallback: '/Engclair/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      // Mirrored by "paths" in tsconfig.app.json.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Pure logic runs in Node; the few suites that need a DOM opt in with a
    // `@vitest-environment jsdom` docblock. Keeps the fast tests fast and
    // proves lib/ really is framework-free.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
  },
})
