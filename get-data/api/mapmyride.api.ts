import type { Workout } from '../../src/types/mapMyRide'
import { getEnv } from '../../src/utils'

const { MMR_AUTH_TOKEN } = getEnv('MMR_AUTH_TOKEN')

const MMR_API_URL = 'https://mapmyride.api.ua.com'

export async function get(endpoint: string) {
  const response = await fetch(`${MMR_API_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      authorization: MMR_AUTH_TOKEN,
    },
  })
  if (!response.ok)
    throw new Error(
      `Failed to get from endpoint ${endpoint}. Status: ${response.status} ${response.statusText} ${await response.text()}`,
    )
  return response
}

export async function getAll<T>(endpoint: string, key: string, params: Record<string, string>) {
  async function getBatch(limit: number, offset: number) {
    const result = await get(
      `/v7.2/${endpoint}/?` +
        new URLSearchParams({
          limit: String(limit),
          offset: String(offset),
          ...params,
        }),
    ).then((r) => r.json())
    return result._embedded[key] as T[]
  }

  const items: T[] = []
  while (items.length % 10 == 0) {
    const newItems = await getBatch(10, items.length)
    items.push(...newItems)
  }

  return items
}

export async function getWorkouts({ user_id }: { user_id: string }) {
  return await getAll<Workout>('workout', 'workouts', {
    user: user_id,
    order_by: 'start_datetime',
  })
}
