import type { GeoJsonObject } from 'geojson'

export interface Link {
  href: string
  id?: string
  name?: string
}

export interface Route {
  city: string
  country: string
  state: string
  starting_location: string
  start_point_type: string
  postal_code: string
  distance: string
  name: string
  description: string
  data_source: string
  images: string
  created_datetime: string
  updated_datetime: string
  points: string
  climbs: string
  total_ascent: string
  total_descent: string
  min_elevation: string
  max_elevation: string
  _links: Record<
    'alternate' | 'privacy' | 'self' | 'activity_types' | 'user' | 'thumbnail' | 'documentation',
    Link[]
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
    cadence_min: number
    cadence_max: number
    cadence_avg: number
    power_min?: number
    power_max?: number
    power_avg?: number
  }
  has_time_series: boolean
  time_series?: Record<string, unknown> // could type
  activity_type?: string
  _links: Record<'self' | 'route' | 'user' | 'privacy' | 'workout_attribution', Link[]>
}

export type CustomGeoJson = GeoJsonObject & { properties: Workout }
