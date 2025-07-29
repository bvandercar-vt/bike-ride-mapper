import { createClient as createSanityClient } from '@sanity/client'
import { kml as kmlToGeoJson } from '@tmcw/togeojson'
import { config } from 'dotenv'
import _ from 'lodash'
import { DateTime } from 'luxon'
import { DOMParser } from 'xmldom'
import { type CustomWorkout } from './types'
import { ActivityName, type ActivityType, type Route, type Workout } from './types/mapMyRide'
import { getEnv } from './utils'

config({ path: '.env.local' })

const { MMR_AUTH_TOKEN, MMR_USER_ID, SANITY_API_TOKEN_WRITE, SANITY_PROJECT_ID } = getEnv(
  'MMR_AUTH_TOKEN',
  'MMR_USER_ID',
  'SANITY_API_TOKEN_WRITE',
  'SANITY_PROJECT_ID',
)

const MMR_API_URL = 'https://mapmyride.api.ua.com'

const sanityClient = createSanityClient({
  projectId: SANITY_PROJECT_ID,
  dataset: 'production',
  token: SANITY_API_TOKEN_WRITE,
  // useCdn: false,
})

const downloadAllRoutes = async (token: string, user_id: string) => {
  async function get(endpoint: string) {
    const response = await fetch(`${MMR_API_URL}${endpoint}`, {
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

  await Promise.all(
    workouts.map(async (workout) => {
      const route: Route = await get(workout._links.route[0].href).then((r) => r.json())
      const activityType: ActivityType = await get(workout._links.activity_type[0].href).then((r) =>
        r.json(),
      )
      if (!Object.values(ActivityName).includes(activityType.name))
        throw new Error(`unexpected activity name ${activityType.name}`)

      const kmlText = await get(route._links.alternate[0].href).then((r) => r.text())
      const kmlParsed = new DOMParser().parseFromString(kmlText)
      const obj = {
        geoJson: kmlToGeoJson(kmlParsed),
        workout: _.omitBy(
          workout,
          (val, key) => _.isObject(val) && key !== 'aggregates',
        ) as CustomWorkout['workout'],
        route: _.omitBy(
          route,
          (val, key) => _.isObject(val) && key !== 'starting_location',
        ) as CustomWorkout['route'],
        activityType: _.omitBy(activityType, (val) =>
          _.isObject(val),
        ) as CustomWorkout['activityType'],
      } satisfies CustomWorkout

      await sanityClient.createOrReplace({
        _type: 'workout',
        _id: `workout-${DateTime.fromISO(obj.workout.start_datetime).toFormat('yyyy-LL-dd-HH-mm-ss')}`,
        title: obj.workout.name,
        ..._.mapValues(obj, (val) => JSON.stringify(val, null, 2)),
      })
    }),
  )
}

await downloadAllRoutes(MMR_AUTH_TOKEN, MMR_USER_ID)
