/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// `base` must match the GitHub Pages sub-path: https://<user>.github.io/Engclair/
export default defineConfig({
  base: '/Engclair/',
  plugins: [react()],
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
  },
})
