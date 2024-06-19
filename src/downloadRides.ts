import { config } from 'dotenv'
import * as fs from 'fs'
import sanitize from 'sanitize-filename'

config({ path: '.env.local' })

const API_URL = 'https://mapmyride.api.ua.com'

const DIR = 'ride_files'

interface Link {
  href: string
  id?: string
  name?: string
}

interface Route {
  city: string
  country: string
  state: string
  starting_location: string
  start_point_type: string
  postal_code: string
  distance: string
  name: string
  description: string
  data_source: string
  images: string
  created_datetime: string
  updated_datetime: string
  points: string
  climbs: string
  total_ascent: string
  total_descent: string
  min_elevation: string
  max_elevation: string
  _links: Record<
    'alternate' | 'privacy' | 'self' | 'activity_types' | 'user' | 'thumbnail' | 'documentation',
    Link[]
  >
}

interface Workout {
  name: string
  start_datetime: string
  start_locale_timezone: string
  created_datetime: string
  updated_datetime: string
  reference_key: string
  source: string
  attachments: Record<string, any>
  sharing: Record<string, any>
  notes: string
  aggregates: {
    distance_total: number
    metabolic_energy_total: number
    active_time_total: number
    elapsed_time_total: number
    steps_total: number
    heartrate_min: number
    heartrate_max: number
    heartrate_avg: number
    speed_min: number
    speed_max: number
    speed_avg: number
    cadence_min: number
    cadence_max: number
    cadence_avg: number
    power_min: number
    power_max: number
    power_avg: number
  }
  has_time_series: boolean
  time_series: Record<string, any> // could type
  activity_type: string
  _links: Record<
    'self' | 'route' | 'activity_type' | 'user' | 'privacy' | 'workout_attribution',
    Link[]
  >
}

const downloadAllRoutes = async (token: string, user_id: string) => {
  async function get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        authorization: token,
      },
    })
    if (!response.ok)
      throw new Error(
        `Failed to get from endpoint ${endpoint}. Status: ${response.status} ${response.statusText} ${await response.text()}`,
      )
    return response
  }

  async function getAll<T>(endpoint: string, key: string, params: Record<string, string>) {
    async function getBatch(limit: number, offset: number) {
      const response = await get(
        `/v7.2/${endpoint}/?` +
          new URLSearchParams({
            limit: String(limit),
            offset: String(offset),
            ...params,
          }),
      )
      const result = await response.json()
      return result._embedded[key] as T[]
    }

    const items: T[] = []
    while (items.length % 10 == 0) {
      const newItems = await getBatch(10, items.length)
      items.push(...newItems)
    }

    return items
  }

  const routes = await getAll<Route>('route', 'routes', { user: user_id, order_by: 'date_created' })

  const workouts = await getAll<Workout>('workout', 'workouts', {
    user: user_id,
    order_by: 'start_datetime',
  })

  console.log('# workouts', workouts.length)

  if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR)
  }

  routes.forEach(async (route) => {
    const response = await get(route._links.alternate[0].href)
    const result = await response.arrayBuffer()
    fs.writeFileSync(`${DIR}/${sanitize(route.name)}.kml`, Buffer.from(result))
  })
}

const { MMR_AUTH_TOKEN, MMR_USER_ID } = process.env
if (!MMR_AUTH_TOKEN || !MMR_USER_ID) throw new Error('need env file')

console.log(MMR_AUTH_TOKEN)
console.log(MMR_USER_ID)

await downloadAllRoutes(MMR_AUTH_TOKEN, MMR_USER_ID)
