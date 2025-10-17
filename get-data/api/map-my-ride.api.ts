import type { ActivityType, Route, Workout } from '../../src/types/mapMyRide'
import { getEnv } from '../../src/utils'

const { MMR_AUTH_TOKEN } = getEnv('MMR_AUTH_TOKEN')

const MMR_API_URL = 'https://mapmyride.api.ua.com'

export async function get(endpoint: string) {
  try {
    const response = await fetch(`${MMR_API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        authorization: MMR_AUTH_TOKEN,
      },
    })

    if (!response.ok) {
      throw new Error(
        `Failed to get from endpoint ${endpoint}\nStatus: ${response.status} ${response.statusText}\nResponse: ${await response.text()}`,
      )
    }

    return response
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err)
    throw err
  }
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
  while (true) {
    const newItems = await getBatch(10, items.length)
    if (newItems.length == 0) break
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

export async function getRoute(workout: Workout): Promise<Route> {
  return await get(workout._links.route[0].href).then((r) => r.json())
}

export async function getActivityType(workout: Workout): Promise<ActivityType> {
  return await get(workout._links.activity_type[0].href).then((r) => r.json())
}

export async function getRoutePathData(route: Route, type: 'gpx' | 'kml') {
  return await get(route._links.alternate.find((l) => l.name == type)!.href).then((r) => r.text())
}
