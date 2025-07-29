import type { GeoJsonObject } from 'geojson'
import type { ActivityType, Route, Workout } from './mapMyRide'

export interface CustomWorkout {
  geoJson: GeoJsonObject
  workout: Omit<Workout, '_links' | 'time_series' | 'sharing' | 'attachments'>
  route: Omit<Route, '_links'>
  activityType: Omit<ActivityType, '_links' | 'mets_speed'>
}
