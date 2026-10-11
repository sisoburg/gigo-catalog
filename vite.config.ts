import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { BASE_PATH } from './src/basePath.ts'

export default defineConfig({
  base: BASE_PATH,
  plugins: [react()],
})
