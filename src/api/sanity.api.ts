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

export const SanityTypes = {
  WORKOUT: 'workout',
} as const

function parseWorkoutResponse(workout: SanityWorkoutResponse): CustomWorkout {
  return {
    ...workout,
    workout: JSON.parse(workout.workout),
    geoJson: JSON.parse(workout.geoJson),
    route: JSON.parse(workout.route),
    activityType: JSON.parse(workout.activityType),
  }
}

export async function* getWorkouts(batchSize = 10): AsyncGenerator<CustomWorkout[], void, unknown> {
  let start = 0

  while (true) {
    const query = `*[_type == "${SanityTypes.WORKOUT}" && (pathHasIssue == false)][${start}...${start + batchSize}]`

    const batch = await sanityClient.fetch<SanityWorkoutResponse[]>(query)

    if (batch.length === 0) {
      break
    }

    yield batch.map(parseWorkoutResponse)

    if (batch.length < batchSize) {
      break
    }

    start += batchSize
  }
}

export type SanityWorkoutResponse = { [K in keyof CustomWorkout]: string } & {
  title: string
  pathHasIssue?: boolean
}
