import { useEffect, useState } from 'react'
import { SanityWorkoutClient } from '../api/sanity.api'
import { type CustomWorkout } from '../types'

export function useWorkouts() {
  const [allData, setAllData] = useState<CustomWorkout[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    const abortController = new AbortController()
    const sanityWorkoutClient = new SanityWorkoutClient()

    const loadWorkoutsInBatches = async () => {
      setIsLoading(true)
      setAllData([])

      try {
        const accumulatedData: CustomWorkout[] = []

        for await (const batch of sanityWorkoutClient.getWorkouts()) {
          if (abortController.signal.aborted) break

          accumulatedData.push(...batch)
          setAllData([...accumulatedData])
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error loading workouts:', error)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadWorkoutsInBatches()

    return () => {
      abortController.abort()
    }
  }, [])

  return [allData, isLoading] as const
}
