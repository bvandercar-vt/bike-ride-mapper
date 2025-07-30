import { config } from 'dotenv'
import { defineCliConfig } from 'sanity/cli'
import { getEnv } from '../src/utils'

config({ path: '../.env.local' })

const { SANITY_PROJECT_ID } = getEnv('SANITY_PROJECT_ID')

export default defineCliConfig({
  api: {
    projectId: SANITY_PROJECT_ID,
    dataset: 'production',
  },
  autoUpdates: true,
  studioHost: 'bike-ride-mapper',
  vite: {
    define: {
      'process.env': process.env,
    },
  },
})
