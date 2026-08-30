import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// `base` must match the GitHub Pages sub-path: https://<user>.github.io/Engclair/
export default defineConfig({
  base: '/Engclair/',
  plugins: [react()],
})
