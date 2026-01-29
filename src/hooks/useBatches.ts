import { useEffect, useState } from 'react'

export interface BatchResult<T> {
  items: T[]
  isLoading: boolean
  total: number | null
  error: unknown
}

/**
 * getBatchGenerator must be stable (use useCallback or a class method).
 */
export function useBatches<T>(
  getBatchGenerator: () => AsyncGenerator<{ batch: T[]; total: number }, void, unknown>,
): BatchResult<T> {
  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [total, setTotal] = useState<number | null>(null)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    const abortController = new AbortController()
    setItems([])
    setIsLoading(true)
    setTotal(null)
    setError(null)

    const load = async () => {
      try {
        const accumulated: T[] = []
        let first = true
        for await (const { batch, total } of getBatchGenerator()) {
          if (abortController.signal.aborted) break
          accumulated.push(...batch)
          setItems([...accumulated])
          if (first) {
            setTotal(total)
            first = false
          }
        }
      } catch (err) {
        if (!abortController.signal.aborted) setError(err)
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false)
      }
    }

    load()
    return () => abortController.abort()
  }, [getBatchGenerator])

  return { items, isLoading, total, error }
}
