import type { CustomWorkout } from '../types'
import { useNdjsonStream } from './useNdjsonStream'

const WORKOUTS_NDJSON_URL = `${import.meta.env.BASE_URL}workouts.ndjson`

export function useWorkouts() {
  const { data, total, isLoading, error } = useNdjsonStream<CustomWorkout>(
    WORKOUTS_NDJSON_URL,
    { batchSize: 10 },
  )

  return { workouts: data, total, isLoading, error }
}
