import type { GeoJsonObject } from 'geojson'
import type { ActivityType, Route, Workout } from './mapMyRide'

export interface CustomWorkout {
  title: string
  pathHasIssue?: boolean
  geoJson: GeoJsonObject
  workout: Omit<Workout, '_links' | 'time_series' | 'sharing' | 'attachments'>
  route: Omit<Route, '_links'>
  activityType: Omit<ActivityType, '_links' | 'mets_speed'>
}

export interface NdJsonMeta {
  _meta?: { total: number }
}
