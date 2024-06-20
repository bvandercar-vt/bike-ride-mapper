import { defineConfig, loadEnv } from 'vite'
import fs from 'vite-plugin-fs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: `/`,
    plugins: [fs()],
    define: {
      'process.env': JSON.stringify(env),
    },
    build: {
      target: 'esnext',
    },
  }
})
