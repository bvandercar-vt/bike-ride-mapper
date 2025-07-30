import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { getEnv } from '../src/utils'
import { schemaTypes } from './schemaTypes'

const { SANITY_PROJECT_ID } = getEnv('SANITY_PROJECT_ID')

export default defineConfig({
  name: 'default',
  title: 'Bike Ride Mapper',

  projectId: SANITY_PROJECT_ID,
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
