import readNDJSONStream from 'ndjson-readablestream'
import { useEffect, useState } from 'react'

export interface NdJsonMeta {
  _meta?: { total: number }
}

const isMetaRow = (row: unknown): row is NdJsonMeta =>
  (row as NdJsonMeta)._meta?.total != null

async function ndjsonStream<T>({
  filepath,
  signal,
  onMeta,
  onBatch,
  batchSize = 50,
}: {
  filepath: string
  signal?: AbortSignal
  onMeta?: (meta: NdJsonMeta) => void
  onBatch?: (batch: T[]) => void
  batchSize?: number
}) {
  const response = await fetch(filepath, { signal })
  if (!response.ok)
    throw new Error(
      `Failed to load data: ${response.status} ${response.statusText}`,
    )
  if (!response.body) throw new Error('No response body')

  let batch: T[] = []

  for await (const obj of readNDJSONStream<T>(response.body)) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

    if (isMetaRow(obj)) {
      onMeta?.(obj)
      continue
    }

    batch.push(obj)

    if (batch.length >= batchSize) {
      onBatch?.(batch)
      batch = []
      // yield so React can paint (optional but helps)
      await Promise.resolve()
    }
  }

  if (batch.length) onBatch?.(batch)
}

export function useNdjsonStream<T>(
  url: string,
  {
    batchSize = 50,
  }: {
    batchSize?: number
  } = {},
) {
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    const ctrl = new AbortController()

    setData([])
    setTotal(null)
    setIsLoading(true)
    setError(null)

    ndjsonStream<T>({
      filepath: url,
      signal: ctrl.signal,
      onMeta: (m: NdJsonMeta) => setTotal(m._meta?.total ?? null),
      onBatch: (batch) => setData((prev) => prev.concat(batch)),
      batchSize,
    })
      .catch((err) => {
        if (err?.name !== 'AbortError') setError(err)
      })
      .finally(() => setIsLoading(false))

    return () => ctrl.abort()
  }, [url, batchSize])

  return { data, total, isLoading, error }
}
