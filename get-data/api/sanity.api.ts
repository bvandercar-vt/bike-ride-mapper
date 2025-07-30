import { sanityClient as baseSanityClient } from '../../src/api/sanity.api'
import { getEnv } from '../../src/utils'

const { SANITY_API_TOKEN_WRITE } = getEnv('SANITY_API_TOKEN_WRITE')

export const sanityClient = baseSanityClient.withConfig({
  token: SANITY_API_TOKEN_WRITE,
  useCdn: true,
})
