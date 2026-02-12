import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: '/bike-ride-mapper/',
    define: {
      'process.env': JSON.stringify(env),
    },
    plugins: [tailwindcss(), react()],
    build: {
      target: 'esnext',
      modulePreload: false,
    },
  }
})
