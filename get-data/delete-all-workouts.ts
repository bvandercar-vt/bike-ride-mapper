import { SanityTypes } from '../src/api/sanity.api'
import { sanityClient } from './api/sanity.api'

const response = await sanityClient.delete({
  query: `*[_type == "${SanityTypes.WORKOUT}"][0...999]`,
})

console.log('Response: ', response)
