import { kml } from '@tmcw/togeojson'
import { config } from 'dotenv'
import * as fs from 'fs'
import * as prettier from 'prettier'
import sanitize from 'sanitize-filename'
import { DOMParser } from 'xmldom'
import type { CustomGeoJson, Route, Workout } from './mapMyRide.d.ts'

config({ path: '.env.local' })

const API_URL = 'https://mapmyride.api.ua.com'

const DIR = 'workout_geojsons'

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

  // const routes = await getAll<Route>('route', 'routes', { user: user_id, order_by: 'date_created' })

  const workouts = await getAll<Workout>('workout', 'workouts', {
    user: user_id,
    order_by: 'start_datetime',
  })

  console.log('# workouts', workouts.length)

  if (fs.existsSync(DIR)) {
    fs.rmdirSync(DIR, { recursive: true })
  }
  fs.mkdirSync(DIR)

  await Promise.all(
    workouts.map(async (workout) => {
      const routeResponse = await get(workout._links.route[0].href)
      const routeResult = (await routeResponse.json()) as Route

      const kmlResponse = await get(routeResult._links.alternate[0].href)
      const kmlResult = await kmlResponse.text()

      const kmlParsed = new DOMParser().parseFromString(kmlResult)
      const geoJsonObj = {
        ...kml(kmlParsed),
        properties: workout,
      } satisfies CustomGeoJson
      const geoJson = await prettier.format(JSON.stringify(geoJsonObj, null, 2), { parser: 'json' })

      const date = new Date(workout.start_datetime)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      const fileName = sanitize(dateStr + ' ' + workout.name)

      // fs.writeFileSync(`${DIR}/${fileName}.kml`, kmlResult)
      fs.writeFileSync(`${DIR}/${fileName}.json`, geoJson)
    }),
  )

  const exportedFiles = fs.readdirSync(DIR)
  if (exportedFiles.length !== workouts.length) throw new Error('overwritten files?')
}

const { MMR_AUTH_TOKEN, MMR_USER_ID } = process.env
if (!MMR_AUTH_TOKEN || !MMR_USER_ID) throw new Error('need env file')

await downloadAllRoutes(MMR_AUTH_TOKEN, MMR_USER_ID)
