import { simplify as simplifyGeoJson_ } from '@turf/simplify'
import type { FeatureCollection, LineString } from 'geojson'

export function simplifyGeoJson(
  geoJson: FeatureCollection,
  options: Parameters<typeof simplifyGeoJson_>[1],
) {
  const geoJsonSimplified = simplifyGeoJson_(geoJson, options)

  if (
    geoJson.features.length !== 1 ||
    geoJsonSimplified.features.length !== 1
  ) {
    throw new Error('more than 1 geoJson feature?')
  }

  const numPointsUnsimplified = (geoJson.features[0].geometry as LineString)
    .coordinates.length
  const numPointsSimplified = (
    geoJsonSimplified.features[0].geometry as LineString
  ).coordinates.length

  return {
    geoJsonSimplified,
    numPointsUnsimplified,
    numPointsSimplified,
  }
}
