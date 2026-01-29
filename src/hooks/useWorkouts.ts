import { useCallback } from 'react'
import { SanityWorkoutClient } from '../api/sanity-workouts.api'
import { type CustomWorkout } from '../types'
import { useBatches } from './useBatches'

const client = new SanityWorkoutClient()

export function useWorkouts() {
  const getWorkoutsGenerator = useCallback(() => client.getWorkouts(), [])
  const {
    items: workouts,
    isLoading,
    total,
    error,
  } = useBatches<CustomWorkout>(getWorkoutsGenerator)
  return { workouts, isLoading, total, error }
}
