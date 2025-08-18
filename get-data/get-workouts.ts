import dotenv from 'dotenv'

await dotenv.config({ path: '.env.local' })

import { gpx as gpxToGeoJson } from '@tmcw/togeojson'
import _ from 'lodash'
import { DateTime } from 'luxon'
import { DOMParser } from 'xmldom'
import type { SanityWorkoutResponse } from '../src/api/sanity.api'
import { ActivityName, type ActivityType, type Route } from '../src/types/mapMyRide'
import { getEnv } from '../src/utils'
import { validatePointsDistance } from './utils/coordinates'
import { getGpxPoints } from './utils/gpx'

// have to import after due to getting the config vars
const mapMyRide = await import('./api/map-my-ride.api')
const { sanityClient } = await import('./api/sanity.api')
const { SanityTypes } = await import('../src/api/sanity.api')

const { MMR_USER_ID } = getEnv('MMR_USER_ID')

console.log('getting workouts from mapmyride...')
const workouts = await mapMyRide.getWorkouts({ user_id: MMR_USER_ID })
console.log('# workouts', workouts.length)

const sanityWorkouts = await sanityClient.fetch<
  ({ _id: string } & Pick<SanityWorkoutResponse, 'pathHasIssue'>)[]
>(`*[_type == "${SanityTypes.WORKOUT}"]{_id, pathHasIssue}`)

console.log('converting KML to GeoJson and uploading to Sanity..')
let errored = false
await Promise.all(
  workouts.map(async (workout) => {
    const workoutDate = DateTime.fromISO(workout.start_datetime, { zone: 'America/Denver' })
    try {
      const route: Route = await mapMyRide.getRoute(workout)
      const activityType: ActivityType = await mapMyRide.getActivityType(workout)

      if (!Object.values(ActivityName).includes(activityType.name))
        throw new Error(`unexpected activity name ${activityType.name}`)

      const gpxText = await mapMyRide.getRoutePathData(route, 'gpx')
      const gpxDoc = new DOMParser().parseFromString(gpxText)
      const geoJson = gpxToGeoJson(gpxDoc)

      const id = `workout-${workoutDate.toFormat('yyyy-LL-dd-HH-mm-ss')}`
      const existingSanityWorkout = sanityWorkouts.find((w) => w._id == id)
      let pathError: Error | undefined = undefined
      if (
        (!existingSanityWorkout &&
          !(route.description.includes('GOOD') || workout.notes.includes('GOOD'))) ||
        existingSanityWorkout?.pathHasIssue
      ) {
        const pathPoints = getGpxPoints(gpxDoc)
        try {
          validatePointsDistance(pathPoints, {
            maxRouteDistanceFt: 500,
            maxStartEndDistanceFt: 1000,
          })
        } catch (err) {
          if (err instanceof Error) pathError = err
        }
      }

      const newData: SanityWorkoutResponse = {
        title: workoutDate.toFormat('yyyy-LL-dd') + ' ' + workout.name,
        pathHasIssue: Boolean(pathError),
        ..._.mapValues(
          {
            geoJson,
            workout,
            route,
            activityType,
          },
          (val) => JSON.stringify(val, null, 2),
        ),
      }

      if (existingSanityWorkout) {
        // patch instead of replace so that don't replace other fields.
        await sanityClient.patch(id).set(newData).commit()
      } else {
        await sanityClient.create({
          _type: SanityTypes.WORKOUT,
          _id: id,
          ...newData,
        })
      }

      if (pathError) throw pathError
    } catch (error) {
      console.error(`Error for workout: ${workout.name} (${workoutDate.toFormat('yyyy-LL-dd')})`)
      errored = true
      if (error instanceof Error) {
        console.error('Error:', error.message)
      } else {
        console.error('An unknown error occurred:', error)
      }
    }
  }),
)

const sanityWorkoutCount = await sanityClient.fetch(`count(*[_type == "${SanityTypes.WORKOUT}"])`)
if (!(sanityWorkoutCount == workouts.length)) {
  throw new Error(
    `should be same length. Workouts in Sanity: ${sanityWorkoutCount} Workouts in MMR: ${workouts.length}`,
  )
}

if (errored) {
  throw new Error('one or more workouts errored')
}
