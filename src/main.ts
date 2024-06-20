/**
 * CSS Imports -- ORDER MATTERS
 */
import 'leaflet/dist/leaflet.css'
import './styles/index.css'

/**
 * Regular imports
 */
import {
  map as createMap,
  geoJSON,
  latLng,
  popup,
  tileLayer,
  type PathOptions,
  type Popup,
} from 'leaflet'
import _ from 'lodash'
import { DateTime } from 'luxon'
import { type CustomGeoJson } from './mapMyRide'

const map = createMap('map', {
  center: latLng(39.7327258, -104.9851469),
  zoom: 13,
})

const { MAPTILER_API_KEY } = process.env
if (!MAPTILER_API_KEY) {
  console.error(process.env)
  throw new Error('need env file')
}

tileLayer(`https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`, {
  //style URL
  tileSize: 512,
  zoomOffset: -1,
  minZoom: 1,
  attribution:
    '\u003ca href="https://www.maptiler.com/copyright/" target="_blank"\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href="https://www.openstreetmap.org/copyright" target="_blank"\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e',
  crossOrigin: true,
}).addTo(map)

const lineStyle: PathOptions = {
  color: 'lime',
  weight: 3,
  opacity: 0.45,
}

const lineStyleHovered: PathOptions = {
  color: 'red',
  weight: 5,
  opacity: 0.6,
}

import geoJsons_ from '../geoJsons.json' assert { type: 'json' }
const geoJsons = geoJsons_ as CustomGeoJson[]

const METERS_TO_MILES = 0.000621371
const METERS_TO_FEET = 3.28084

await Promise.all(
  geoJsons.map(async (geoJson) => {
    const { workout, route } = geoJson.properties
    const feature = geoJSON(geoJson, {
      style: lineStyle,
      filter: (feature) => feature.geometry.type !== 'Point',
    }).addTo(map)

    const date = DateTime.fromISO(workout.start_datetime)
    const dateStr = date.toFormat('EEE. MMMM d, yyyy h:mma')
    const distanceStr = _.round(route.distance * METERS_TO_MILES, 1)
    const ascentStr = _.round(route.total_ascent * METERS_TO_FEET, 0)
    const popover = document.createElement('div')
    popover.classList.add('route-popover')
    popover.innerHTML = `<b>${dateStr}</b><br><i><b>Distance: ${distanceStr}mi</b></i><br><i>Total Ascent: ${ascentStr}ft</i>`

    let layerPopup: Popup | null
    feature.on('mouseover', function (e) {
      layerPopup = popup().setLatLng(e.latlng).setContent(popover.outerHTML).openOn(map)
      feature.setStyle(lineStyleHovered)
      feature.bringToFront()
    })
    feature.on('click', function (e) {
      layerPopup = popup().setLatLng(e.latlng).setContent(popover.outerHTML).openOn(map)
      feature.setStyle(lineStyleHovered)
      feature.bringToFront()
    })
    feature.on('mouseout', function () {
      if (layerPopup) {
        map.closePopup(layerPopup)
        layerPopup = null
      }
      feature.setStyle(lineStyle)
    })
  }),
)

const numRoutes = geoJsons.length
const distances = geoJsons.map(({ properties }) => properties.route.distance)
const totalDistanceStr = _.round(_.sum(distances) * METERS_TO_MILES, 1)
const longestDistanceStr = _.round(_.max(distances)! * METERS_TO_MILES, 1)

document.getElementById('total-stats')!.innerHTML =
  `# Rides: ${numRoutes}<br>Total Distance: ${totalDistanceStr}mi<br>Longest Ride: ${longestDistanceStr}mi`
