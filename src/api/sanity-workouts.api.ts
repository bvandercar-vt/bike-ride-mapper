import type { CustomWorkout } from '../types'
import { SanityClientBase } from './sanity-core.api'

export type SanityWorkoutResponse = { [K in keyof CustomWorkout]: string } & {
  title: string
  pathHasIssue?: boolean
}

export class SanityWorkoutClient extends SanityClientBase {
  public static readonly Types = {
    WORKOUT: 'workout',
  } as const

  public static readonly WORKOUT_FILTER = `_type == "${SanityWorkoutClient.Types.WORKOUT}"` as const
  private static readonly WORKOUT_FILTER_VALIDATED_ONLY =
    `${SanityWorkoutClient.WORKOUT_FILTER} && (pathHasIssue == false)` as const

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
    for await (const { batch, total } of this.getBatches<SanityWorkoutResponse>(
      SanityWorkoutClient.WORKOUT_FILTER_VALIDATED_ONLY,
      batchSize,
    )) {
      yield {
        batch: batch.map(SanityWorkoutClient.parseWorkoutResponse),
        total,
      }
    }
  }
}
