const FEET_PER_DEGREE_LAT = 364000 // ~69 miles × 5280 ft/mile
const FEET_PER_DEGREE_LON_AT_EQUATOR = 365000 // Approx

export type Point = [number, number]

function flatDistanceFeet([lat1, lon1]: Point, [lat2, lon2]: Point): number {
  const avgLat = (lat1 + lat2) / 2
  const latFeet = (lat2 - lat1) * FEET_PER_DEGREE_LAT
  const lonFeet =
    (lon2 - lon1) * FEET_PER_DEGREE_LON_AT_EQUATOR * Math.cos((avgLat * Math.PI) / 180)
  return Math.sqrt(latFeet ** 2 + lonFeet ** 2)
}

export function validatePointsDistance(
  points: Point[],
  {
    maxRouteDistanceFt,
    maxStartEndDistanceFt,
  }: { maxRouteDistanceFt: number; maxStartEndDistanceFt: number },
) {
  if (points.length < 2) {
    throw new Error('Not enough track points in GPX')
  }

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]

    const distFeet = flatDistanceFeet(prev, curr)

    if (distFeet > maxRouteDistanceFt) {
      throw new Error(
        `Points ${i - 1} and ${i} (out of ${points.length}) are ${distFeet.toFixed(0)} feet apart, exceeding limit of ${maxRouteDistanceFt}.`,
      )
    }
  }

  const distFeet = flatDistanceFeet(points[0], points.at(-1)!)
  if (distFeet > maxStartEndDistanceFt) {
    throw new Error(
      `Start and End points are ${distFeet.toFixed(0)} feet apart, exceeding limit of ${maxStartEndDistanceFt}.`,
    )
  }
}
