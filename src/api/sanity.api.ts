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
  apiVersion: '2025-07-29',
  useCdn: false,
})

export async function getWorkouts(): Promise<CustomWorkout[]> {
  const workouts = await sanityClient.fetch<SanityWorkoutResponse[]>('*[_type == "workout"]')
  return workouts.map((w) => ({
    ...w,
    workout: JSON.parse(w.workout),
    geoJson: JSON.parse(w.geoJson),
    route: JSON.parse(w.route),
    activityType: JSON.parse(w.activityType),
  }))
}

export type SanityWorkoutResponse = { [K in keyof CustomWorkout]: string } & { title: string }
