import type { GeoJsonObject } from 'geojson'
import type { Simplify } from 'type-fest'

export interface Link {
  href: string
  id?: string
  name?: string
}

type Links<R extends string | undefined = undefined, O extends string | undefined = undefined> =
  // @ts-expect-error doesnt actually create an error
  Simplify<Record<R, Link[]> & Partial<Record<O, Link[]>>>

export interface Route {
  city: string
  country: string
  state: string
  starting_location: { type: string; coordinates: number[] }
  start_point_type: string
  postal_code: string
  distance: number
  name: string
  description: string
  data_source: string
  images?: string
  created_datetime: string
  updated_datetime: string
  points: string | null
  climbs: string | null
  total_ascent: number
  total_descent: number
  min_elevation: number
  max_elevation: number
  _links: Links<
    'self' | 'documentation' | 'alternate' | 'thumbnail',
    'privacy' | 'user' | 'activity_types'
  >
}

export interface Workout {
  name: string
  start_datetime: string
  start_locale_timezone: string
  created_datetime: string
  updated_datetime: string
  reference_key: string
  source: string
  attachments?: Record<string, unknown>
  sharing?: Record<string, unknown>
  notes: string
  aggregates: {
    distance_total: number
    metabolic_energy_total: number
    active_time_total: number
    elapsed_time_total: number
    steps_total: number
    heartrate_min?: number
    heartrate_max?: number
    heartrate_avg?: number
    speed_min?: number
    speed_max?: number
    speed_avg: number
    cadence_min?: number
    cadence_max?: number
    cadence_avg?: number
    power_min?: number
    power_max?: number
    power_avg?: number
  }
  has_time_series: boolean
  time_series?: Record<string, unknown> // could type
  activity_type?: string
  _links: Links<
    | 'self'
    | 'documentation'
    | 'user'
    | 'activity_type'
    | 'route'
    | 'privacy'
    | 'alternate'
    | 'thumbnail'
  >
}

export enum ActivityName {
  BIKE_RIDE = 'Bike Ride',
  WALK = 'Walk',
  RUN = 'Run',
}

export interface ActivityType {
  name: ActivityName
  short_name: string
  location_aware: boolean
  import_only: boolean
  mets: number
  mets_speed: Array<{ speed: number; mets: number }>
  _links: Links<'self' | 'documentation' | 'root' | 'icon_url'>
}

export type CustomGeoJson = GeoJsonObject & {
  properties: {
    workout: Omit<Workout, '_links' | 'time_series' | 'sharing' | 'attachments'>
    route: Omit<Route, '_links'>
    activityType: Omit<ActivityType, '_links' | 'mets_speed'>
  }
}
