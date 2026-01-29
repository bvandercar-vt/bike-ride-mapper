import { SanityWorkoutClient } from '../../src/api/sanity.api'
import { getEnv } from '../../src/utils'

const { SANITY_API_TOKEN_WRITE } = getEnv('SANITY_API_TOKEN_WRITE')

export const sanityClient = new SanityWorkoutClient().client.withConfig({
  token: SANITY_API_TOKEN_WRITE,
  useCdn: true,
})
