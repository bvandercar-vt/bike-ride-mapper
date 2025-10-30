import { createClient as createSanityClient, type SanityClient } from '@sanity/client'
import type { CustomWorkout } from '../types'
import { getEnv } from '../utils'

const { SANITY_API_TOKEN_READ, SANITY_PROJECT_ID } = getEnv(
  'SANITY_API_TOKEN_READ',
  'SANITY_PROJECT_ID',
)

export type SanityWorkoutResponse = { [K in keyof CustomWorkout]: string } & {
  title: string
  pathHasIssue?: boolean
}

export class SanityWorkoutClient {
  public client: SanityClient

  public static readonly SanityTypes = {
    WORKOUT: 'workout',
  } as const

  constructor() {
    this.client = createSanityClient({
      projectId: SANITY_PROJECT_ID,
      dataset: 'production',
      token: SANITY_API_TOKEN_READ,
      apiVersion: '2025-07-29',
      useCdn: false,
    })
  }

  private static parseWorkoutResponse(workout: SanityWorkoutResponse): CustomWorkout {
    return {
      ...workout,
      workout: JSON.parse(workout.workout),
      geoJson: JSON.parse(workout.geoJson),
      route: JSON.parse(workout.route),
      activityType: JSON.parse(workout.activityType),
    }
  }

  async *getWorkouts(batchSize = 10): AsyncGenerator<CustomWorkout[], void, unknown> {
    let start = 0

    while (true) {
      const query = `*[_type == "${SanityWorkoutClient.SanityTypes.WORKOUT}" && (pathHasIssue == false)][${start}...${start + batchSize}]`

      const batch = await this.client.fetch<SanityWorkoutResponse[]>(query)

      if (batch.length === 0) {
        break
      }

      yield batch.map(SanityWorkoutClient.parseWorkoutResponse)

      if (batch.length < batchSize) {
        break
      }

      start += batchSize
    }
  }
}
