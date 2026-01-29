import { useEffect, useState } from 'react'
import { SanityWorkoutClient } from '../api/sanity.api'
import { type CustomWorkout } from '../types'

export function useWorkouts() {
  const [data, setData] = useState<CustomWorkout[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    const abortController = new AbortController()
    const sanityWorkoutClient = new SanityWorkoutClient()

    const loadWorkoutsInBatches = async () => {
      setIsLoading(true)
      setData([])
      setTotal(null)

      try {
        const accumulatedData: CustomWorkout[] = []
        let first = true

        for await (const { batch, total } of sanityWorkoutClient.getWorkouts()) {
          if (abortController.signal.aborted) break

          accumulatedData.push(...batch)
          setData([...accumulatedData])
          if (first) {
            setTotal(total)
            first = false
          }
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

  return [data, isLoading, total] as const
}
