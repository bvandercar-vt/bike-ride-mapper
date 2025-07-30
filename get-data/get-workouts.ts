import dotenv from 'dotenv'

await dotenv.config({ path: '.env.local' })

import { kml as kmlToGeoJson } from '@tmcw/togeojson'
import _ from 'lodash'
import { DateTime } from 'luxon'
import { DOMParser } from 'xmldom'
import type { SanityWorkoutResponse } from '../src/api/sanity.api'
import { ActivityName, type ActivityType, type Route } from '../src/types/mapMyRide'
import { getEnv } from '../src/utils'

// have to import after due to getting the config vars
const mapMyRide = await import('./api/map-my-ride.api')
const { sanityClient } = await import('./api/sanity.api')

const { MMR_USER_ID } = getEnv('MMR_USER_ID')

console.log('getting workouts from mapmyride...')
const workouts = await mapMyRide.getWorkouts({ user_id: MMR_USER_ID })
console.log('# workouts', workouts.length)

await Promise.all(
  workouts.map((workout) => async () => {
    try {
      const workoutDate = DateTime.fromISO(workout.start_datetime)
      const route: Route = await mapMyRide.get(workout._links.route[0].href).then((r) => r.json())
      const activityType: ActivityType = await mapMyRide
        .get(workout._links.activity_type[0].href)
        .then((r) => r.json())
      if (!Object.values(ActivityName).includes(activityType.name))
        throw new Error(`unexpected activity name ${activityType.name}`)

      const kmlText = await mapMyRide.get(route._links.alternate[0].href).then((r) => r.text())
      const kmlParsed = new DOMParser().parseFromString(kmlText)
      const geoJson = kmlToGeoJson(kmlParsed)

      await sanityClient.createOrReplace<SanityWorkoutResponse>({
        _type: 'workout',
        _id: `workout-${workoutDate.toFormat('yyyy-LL-dd-HH-mm-ss')}`,
        title: workoutDate.toFormat('yyyy-LL-dd') + ' ' + workout.name,
        ..._.mapValues(
          {
            geoJson,
            workout,
            route,
            activityType,
          },
          (val) => JSON.stringify(val, null, 2),
        ),
      })
    } catch (error) {
      console.error(`Error for workout: [name] ${workout.name} [time] ${workout.start_datetime}`)
      if (error instanceof Error) {
        console.error('Error:', error.message)
      } else {
        console.error('An unknown error occurred:', error)
      }
    }
  }),
)
