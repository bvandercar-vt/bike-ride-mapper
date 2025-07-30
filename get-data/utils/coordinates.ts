const FEET_PER_DEGREE_LAT = 364000 // ~69 miles × 5280 ft/mile
const FEET_PER_DEGREE_LON_AT_EQUATOR = 365000 // Approx

export type Point = [number, number]

/** FLAT distance */
export function getDistanceFeet([lat1, lon1]: Point, [lat2, lon2]: Point): number {
  const avgLat = (lat1 + lat2) / 2
  const latFeet = (lat2 - lat1) * FEET_PER_DEGREE_LAT
  const lonFeet =
    (lon2 - lon1) * FEET_PER_DEGREE_LON_AT_EQUATOR * Math.cos((avgLat * Math.PI) / 180)
  return Math.sqrt(latFeet ** 2 + lonFeet ** 2)
}

export function getMaxDistanceFeet(points: Point[]) {
  if (points.length < 2) {
    throw new Error('Not enough points')
  }

  let maxDistance = 0
  let maxDistanceIndex = -1

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]

    const distanceFeet = getDistanceFeet(prev, curr)
    if (distanceFeet > maxDistance) {
      maxDistance = distanceFeet
      maxDistanceIndex = i
    }
  }

  return { maxDistance, maxDistanceIndex }
}

export function validatePointsDistance(
  points: Point[],
  {
    maxRouteDistanceFt,
    maxStartEndDistanceFt,
  }: { maxRouteDistanceFt: number; maxStartEndDistanceFt: number },
) {
  const startEndDistanceFt = getDistanceFeet(points[0], points.at(-1)!)
  if (startEndDistanceFt > maxStartEndDistanceFt) {
    throw new Error(
      `Start and End points are ${startEndDistanceFt.toFixed(0)} feet apart, exceeding limit of ${maxStartEndDistanceFt}.`,
    )
  }

  const { maxDistance, maxDistanceIndex } = getMaxDistanceFeet(points)
  if (maxDistance > maxRouteDistanceFt) {
    throw new Error(
      `Points ${maxDistanceIndex - 1} and ${maxDistanceIndex} (out of ${points.length}) are ${maxDistance.toFixed(0)} feet apart, exceeding limit of ${maxRouteDistanceFt}.`,
    )
  }
}
