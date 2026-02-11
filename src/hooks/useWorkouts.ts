import readNDJSONStream from 'ndjson-readablestream'
import { useEffect, useState } from 'react'
import type { NdJsonMeta } from '../types'
import { type CustomWorkout } from '../types'

const WORKOUTS_NDJSON_URL = `${import.meta.env.BASE_URL}workouts.ndjson`

const isMetaRow = (row: unknown): row is NdJsonMeta => (row as NdJsonMeta)._meta?.total != null

async function loadWorkouts(): Promise<CustomWorkout[]> {
  const response = await fetch(WORKOUTS_NDJSON_URL)
  if (!response.ok) {
    throw new Error(`Failed to load workouts: ${response.status} ${response.statusText}`)
  }
  const body = response.body
  if (!body) {
    throw new Error('No response body')
  }

  const workouts: CustomWorkout[] = []
  for await (const obj of readNDJSONStream<NdJsonMeta | CustomWorkout>(body)) {
    if (isMetaRow(obj)) continue
    workouts.push(obj)
  }
  return workouts
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<CustomWorkout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let cancelled = false
    setWorkouts([])
    setIsLoading(true)
    setError(null)

    loadWorkouts()
      .then((data) => {
        if (!cancelled) setWorkouts(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { workouts, isLoading, error }
}
