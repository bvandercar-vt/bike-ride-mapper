import { readFileSync, writeFileSync } from 'node:fs'
import { gpx as gpxToGeoJson } from '@tmcw/togeojson'
import type { LineString } from 'geojson'
import { DateTime } from 'luxon'
import { DOMParser } from 'xmldom'

import type { CustomWorkout } from '../src/types'
import {
  ActivityName,
  type ActivityType,
  type Route,
} from '../src/types/mapMyRide'
import { getEnv } from '../src/utils'
import { MapMyRideClient } from './api/map-my-ride.api'
import type { Point } from './utils/coordinates'
import { validatePointsDistance } from './utils/coordinates'
import { simplifyGeoJson } from './utils/geoJson'

const { MMR_USER_ID } = getEnv('MMR_USER_ID')

console.log('getting workouts from mapmyride...')
const mapMyRideClient = new MapMyRideClient()
const workouts = await mapMyRideClient.getWorkouts({ user_id: MMR_USER_ID })
console.log('# workouts', workouts.length)

console.log('converting GPX to GeoJson and writing to files..')
let errored = false
let totalNumPointsUnsimplified = 0
let totalNumPointsSimplified = 0
await Promise.all(
  workouts.map(async (workout) => {
    const workoutDate = DateTime.fromISO(workout.start_datetime, {
      zone: 'America/Denver',
    })
    try {
      const route: Route = await mapMyRideClient.getRoute(workout)
      const activityType: ActivityType =
        await mapMyRideClient.getActivityType(workout)

      if (!Object.values(ActivityName).includes(activityType.name))
        throw new Error(`unexpected activity name ${activityType.name}`)

      const gpxText = await mapMyRideClient.getRoutePathData(route, 'gpx')
      const gpxDoc = new DOMParser().parseFromString(gpxText)
      const geoJson = gpxToGeoJson(gpxDoc)

      const id = `workout-${workoutDate.toFormat('yyyy-LL-dd-HH-mm-ss')}`
      const filePath = `workouts/${id}.json`

      const existingWorkout: CustomWorkout | undefined = (() => {
        try {
          return JSON.parse(readFileSync(filePath, 'utf8'))
        } catch {
          return undefined
        }
      })()

      let pathError: Error | undefined
      if (
        (!existingWorkout &&
          ![route.description, workout.notes].some((note) =>
            note?.includes('GOOD'),
          )) ||
        existingWorkout?.pathHasIssue
      ) {
        const pathPoints = (geoJson.features[0].geometry as LineString)
          .coordinates as Point[]
        try {
          validatePointsDistance(pathPoints, {
            maxRouteDistanceFt: 500,
            maxStartEndDistanceFt: 1000,
          })
        } catch (err) {
          if (err instanceof Error) pathError = err
        }
      }

      if (pathError) throw pathError

      const { geoJsonSimplified, numPointsUnsimplified, numPointsSimplified } =
        simplifyGeoJson(geoJson, { tolerance: 0.000_000_1, highQuality: true })
      totalNumPointsUnsimplified += numPointsUnsimplified
      totalNumPointsSimplified += numPointsSimplified

      const newData: CustomWorkout = {
        title: `${workoutDate.toFormat('yyyy-LL-dd')} ${workout.name}`,
        pathHasIssue: Boolean(pathError),
        geoJson: geoJsonSimplified,
        workout,
        route,
        activityType,
      }

      writeFileSync(filePath, JSON.stringify(newData, null, 2))
    } catch (error) {
      console.error(
        `Error for workout: ${workout.name} (${workoutDate.toFormat('yyyy-LL-dd')})`,
      )
      errored = true
      if (error instanceof Error) {
        console.error('Error:', error.message)
      } else {
        console.error('An unknown error occurred:', error)
      }
    }
  }),
)

console.log(
  `GeoJsons simplified by ${totalNumPointsUnsimplified - totalNumPointsSimplified} data points (${(((totalNumPointsSimplified - totalNumPointsUnsimplified) / totalNumPointsUnsimplified) * 100).toFixed(0)}%)`,
)

if (errored) {
  throw new Error('one or more workouts errored')
}
