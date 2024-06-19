import { kml } from '@tmcw/togeojson'
import { config } from 'dotenv'
import * as fs from 'fs'
import _ from 'lodash'
import * as prettier from 'prettier'
import { DOMParser } from 'xmldom'
import {
  ActivityName,
  type ActivityType,
  type CustomGeoJson,
  type Route,
  type Workout,
} from './types/mapMyRide'

config({ path: '.env.local' })

const API_URL = 'https://mapmyride.api.ua.com'

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

  // const routes = await getAll<Route>('route', 'routes', { user: user_id, order_by: 'date_created' })

  const workouts = await getAll<Workout>('workout', 'workouts', {
    user: user_id,
    order_by: 'start_datetime',
  })

  console.log('# workouts', workouts.length)

  const geoJsonObjects = await Promise.all(
    workouts.map(async (workout) => {
      const route: Route = await get(workout._links.route[0].href).then((r) => r.json())
      const activityType: ActivityType = await get(workout._links.activity_type[0].href).then((r) =>
        r.json(),
      )
      if (!Object.values(ActivityName).includes(activityType.name))
        throw new Error(`unexpected activity name ${activityType.name}`)

      const kmlText = await get(route._links.alternate[0].href).then((r) => r.text())
      const kmlParsed = new DOMParser().parseFromString(kmlText)
      const geoJsonObj = {
        ...kml(kmlParsed),
        properties: {
          workout: _.omitBy(
            workout,
            (val, key) => _.isObject(val) && key !== 'aggregates',
          ) as CustomGeoJson['properties']['workout'],
          route: _.omitBy(
            route,
            (val, key) => _.isObject(val) && key !== 'starting_location',
          ) as CustomGeoJson['properties']['route'],
          activityType: _.omitBy(activityType, (val) =>
            _.isObject(val),
          ) as CustomGeoJson['properties']['activityType'],
        },
      } satisfies CustomGeoJson
      return geoJsonObj
    }),
  )
  const geoJsons = await prettier.format(JSON.stringify(geoJsonObjects, null, 2), {
    parser: 'json',
  })
  fs.writeFileSync(`geoJsons.json`, geoJsons)
}

const { MMR_AUTH_TOKEN, MMR_USER_ID } = process.env
if (!MMR_AUTH_TOKEN || !MMR_USER_ID) throw new Error('need env file')

await downloadAllRoutes(MMR_AUTH_TOKEN, MMR_USER_ID)
