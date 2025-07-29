import { createClient as createSanityClient } from '@sanity/client'
import type { CustomWorkout } from '../types'
import { getEnv } from '../utils'

const { SANITY_API_TOKEN_READ, SANITY_PROJECT_ID } = getEnv(
  'SANITY_API_TOKEN_READ',
  'SANITY_PROJECT_ID',
)

export const sanityClient = createSanityClient({
  projectId: SANITY_PROJECT_ID,
  dataset: 'production',
  token: SANITY_API_TOKEN_READ,
  // useCdn: false,
})

export async function getWorkouts(): Promise<CustomWorkout[]> {
  const workouts =
    await sanityClient.fetch<{ [K in keyof CustomWorkout]: string }[]>('*[_type == "workout"]')
  return workouts.map((w) => ({
    ...w,
    workout: JSON.parse(w.workout),
    geoJson: JSON.parse(w.geoJson),
    route: JSON.parse(w.route),
    activityType: JSON.parse(w.activityType),
  }))
}
