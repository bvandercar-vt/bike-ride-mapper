import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: '/bike-ride-mapper/',
    define: {
      'process.env': JSON.stringify(env),
    },
    build: {
      target: 'esnext',
    },
  }
})
