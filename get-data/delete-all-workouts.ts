import dotenv from 'dotenv'

await dotenv.config({ path: '.env.local' })

// have to import after due to getting the config vars
const { SanityTypes } = await import('../src/api/sanity.api')
const { sanityClient } = await import('./api/sanity.api')

const response = await sanityClient.delete({
  query: `*[_type == "${SanityTypes.WORKOUT}"][0...999]`,
})

console.log('Response: ', response)
