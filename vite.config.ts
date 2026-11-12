
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],

  // Include both HTML pages in the production build
  input: {
    main: resolve(import.meta.dirname, 'index.html'),
    personalized: resolve(import.meta.dirname, 'mindcare_personalized.html'),
  },
})
