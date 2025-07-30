export function getGpxPoints(gpxDoc: Document): [number, number][] {
  const trkpts = Array.from(gpxDoc.getElementsByTagName('trkpt'))

  return trkpts.map((trkpt, i) => {
    const latitude = parseFloat(trkpt.getAttribute('lat') || '')
    const longitude = parseFloat(trkpt.getAttribute('lon') || '')

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      throw new Error(`Invalid coordinates at point ${i}`)
    }
    return [latitude, longitude]
  })
}
