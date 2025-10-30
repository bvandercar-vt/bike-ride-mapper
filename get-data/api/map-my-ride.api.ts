import type { ActivityType, OAuthResponse, Route, Workout } from '../../src/types/mapMyRide'
import { getEnv } from '../../src/utils'
import { getInput } from '../utils/get-input'

const MMR_API_URL = 'https://api.mapmyfitness.com'

const { MMR_CLIENT_ID, MMR_AUTH_TOKEN } = getEnv('MMR_CLIENT_ID', 'MMR_AUTH_TOKEN')

const apiKeyHeader = { 'Api-Key': MMR_CLIENT_ID }
const authHeader = { Authorization: 'Bearer ' + MMR_AUTH_TOKEN }

export async function request(endpoint: string, args: RequestInit) {
  try {
    const response = await fetch(`${MMR_API_URL}${endpoint}`, args)

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

export async function get(endpoint: string) {
  return await request(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...apiKeyHeader,
    },
  })
}

export async function getOAuthToken(params: {
  grant_type: 'authorization_code' | 'client_credentials' | 'refresh_token'
  code?: string
  refresh_token?: string
}) {
  const { MMR_CLIENT_SECRET } = getEnv('MMR_CLIENT_SECRET')
  const response: OAuthResponse = await request('/v7.2/oauth2/access_token/', {
    method: 'POST',
    headers: { ...apiKeyHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      ...params,
      client_id: MMR_CLIENT_ID,
      client_secret: MMR_CLIENT_SECRET,
    }),
  }).then((r) => r.json())
  return response
}

// @ts-expect-error for special use when uncommented
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function printAuthToken() {
  const baseUrl = 'https://www.mapmyfitness.com/oauth2/authorize/'
  const params = new URLSearchParams({
    client_id: MMR_CLIENT_ID,
    response_type: 'code',
    redirect_uri: 'http://www.google.com',
  })
  console.log(`${baseUrl}?${params.toString()}`)
  console.log('The code is in the code param at the URL')
  const code = await getInput('Enter the code: ')
  const tokenResponse = await getOAuthToken({ grant_type: 'authorization_code', code })

  console.log('Enter to environment MMR_AUTH_TOKEN :\n', tokenResponse.access_token)
  console.log(`Expires in: ${tokenResponse.expires_in / (24 * 60 * 60)} days`)
  process.exit(0)
}

// await printAuthToken()

export async function getAll<T>(endpoint: string, key: string, params: Record<string, string>) {
  async function getBatch(limit: number, offset: number) {
    const response = await get(
      `/v7.2/${endpoint}/?` +
        new URLSearchParams({
          limit: String(limit),
          offset: String(offset),
          ...params,
        }),
    ).then((r) => r.json())
    return response._embedded[key] as T[]
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
