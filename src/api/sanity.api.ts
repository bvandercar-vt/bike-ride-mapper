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

  async *getWorkouts(
    batchSize = 10,
  ): AsyncGenerator<{ batch: CustomWorkout[]; total: number }, void, unknown> {
    let offset = 0
    let total: number | undefined = undefined

    const FILTER = `_type == "${SanityWorkoutClient.SanityTypes.WORKOUT}" && (pathHasIssue == false)`

    while (true) {
      let items: SanityWorkoutResponse[] = []
      if (offset === 0) {
        const query = `{
          "items": *[${FILTER}][0...${batchSize}],
          "total": count(*[${FILTER}])
        }`
        const result = await this.client.fetch<{ items: SanityWorkoutResponse[]; total: number }>(
          query,
        )
        items = result.items
        total = result.total
      } else {
        const query = `*[${FILTER}][${offset}...${offset + batchSize}]`
        items = await this.client.fetch<SanityWorkoutResponse[]>(query)
      }

      if (items.length === 0) {
        break
      }

      yield {
        batch: items.map(SanityWorkoutClient.parseWorkoutResponse),
        total: total!,
      }

      if (items.length < batchSize) {
        break
      }

      offset += batchSize
    }
  }
}
