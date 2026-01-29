import { SanityWorkoutClient } from '../src/api/sanity-workouts.api'
import { sanityClient } from './api/sanity.api'

const response = await sanityClient.delete({
  query: `*[${SanityWorkoutClient.WORKOUT_FILTER}][0...999]`,
})

console.log('Response: ', response)
