import { createClient as createSanityClient } from '@sanity/client'
import { kml as kmlToGeoJson } from '@tmcw/togeojson'
import { config } from 'dotenv'
import _ from 'lodash'
import { DateTime } from 'luxon'
import { DOMParser } from 'xmldom'
import { type CustomWorkout } from '../src/types'
import { ActivityName, type ActivityType, type Route } from '../src/types/mapMyRide'
import { getEnv } from '../src/utils'
import { get, getWorkouts } from './api/mapmyride.api'

config({ path: '.env.local' })

const { MMR_USER_ID, SANITY_API_TOKEN_WRITE, SANITY_PROJECT_ID } = getEnv(
  'MMR_USER_ID',
  'SANITY_API_TOKEN_WRITE',
  'SANITY_PROJECT_ID',
)

const sanityClient = createSanityClient({
  projectId: SANITY_PROJECT_ID,
  dataset: 'production',
  token: SANITY_API_TOKEN_WRITE,
  // useCdn: false,
})

const downloadAllRoutes = async (user_id: string) => {
  const workouts = await getWorkouts({ user_id })
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

await downloadAllRoutes(MMR_USER_ID)
