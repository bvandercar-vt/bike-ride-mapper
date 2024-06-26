/**
 * CSS Imports -- ORDER MATTERS
 */
import 'leaflet/dist/leaflet.css'
import './styles/index.css'

/**
 * Regular imports
 */
import {
  Symbol,
  control,
  map as createMap,
  geoJSON,
  latLng,
  polylineDecorator,
  tileLayer,
  type PathOptions,
  type PolylineDecorator,
} from 'leaflet'
import 'leaflet-polylinedecorator'
import _ from 'lodash'
import { DateTime } from 'luxon'
import { type CustomGeoJson } from './types/mapMyRide'

const METERS_TO_MILES = 0.000621371
const METERS_TO_FEET = 3.28084

const map = createMap('map', {
  center: latLng(39.7327258, -104.9851469),
  zoom: 13,
})

const { MAPTILER_API_KEY } = process.env
if (!MAPTILER_API_KEY) {
  console.error(process.env)
  throw new Error('need env file')
}

const mapLayer = tileLayer(
  `https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
  {
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    crossOrigin: true,
  },
).addTo(map)

const satelliteLayer = tileLayer(
  `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAPTILER_API_KEY}`,
  {
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    crossOrigin: true,
  },
)

const trailLayer = tileLayer('http://{s}.google.com/vt/lyrs=bike&x={x}&y={y}&z={z}', {
  maxZoom: 20,
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  opacity: 0.5,
  className: 'bike-trails',
})

const baseMaps = {
  Default: mapLayer,
  Satellite: satelliteLayer,
}

const overlayMaps = {
  'Bike Trails': trailLayer,
}

control.layers(baseMaps, overlayMaps, { position: 'topleft', collapsed: false }).addTo(map)

function setBikeTrailsStyle(isSatellite: boolean) {
  const bikeTrails = document.getElementsByClassName('bike-trails')[0]! as HTMLElement
  bikeTrails.classList.toggle('bike-trails-satellite', isSatellite)
  bikeTrails.classList.toggle('bike-trails-dark', !isSatellite)
}
map.on('baselayerchange', (e) => {
  const isSatellite = e.name === 'Satellite'
  setBikeTrailsStyle(isSatellite)
})

map.on('overlayadd', () => {
  const isSatellite = map.hasLayer(satelliteLayer)
  setBikeTrailsStyle(isSatellite)
})

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

geoJsons.forEach((geoJson) => {
  const { workout, route } = geoJson.properties
  const date = DateTime.fromISO(workout.start_datetime)
  const dateStr = date.toFormat('EEE. MMMM d, yyyy h:mma')
  const distanceStr = _.round(route.distance * METERS_TO_MILES, 1)
  const ascentStr = _.round(route.total_ascent * METERS_TO_FEET, 0)
  const popover = document.createElement('div')
  popover.classList.add('route-popover')
  popover.innerHTML = `<b>${dateStr}</b>
  <br><i><b>Distance: ${distanceStr}mi</b></i>
  <br><i>Total Ascent: ${ascentStr}ft</i>`

  const feature = geoJSON(geoJson, {
    style: lineStyle,
    filter: (feature) => feature.geometry.type !== 'Point',
  }).addTo(map)
  const featureHover = geoJSON(geoJson, {
    style: { weight: 30, opacity: 0 },
    filter: (feature) => feature.geometry.type !== 'Point',
  }).addTo(map)
  featureHover.bindTooltip(popover.outerHTML, { direction: 'top', sticky: true })
  let arrowsDecorator: PolylineDecorator
  featureHover.on('mouseover', function () {
    feature.setStyle(lineStyleHovered)
    feature.bringToFront()
    featureHover.bringToFront()
    feature.getLayers().map((layer) => {
      // @ts-expect-error WORKS
      arrowsDecorator = polylineDecorator(layer, {
        patterns: [
          {
            repeat: 60,
            symbol: Symbol.arrowHead({
              pixelSize: 13,
              pathOptions: {
                fillOpacity: lineStyleHovered.opacity,
                color: lineStyleHovered.color,
                weight: 0,
              },
            }),
          },
        ],
      }).addTo(map)
    })
  })
  featureHover.on('mouseout', function () {
    feature.setStyle(lineStyle)
    arrowsDecorator.remove()
  })
})

const numRoutes = geoJsons.length
const distances = geoJsons.map(({ properties }) => properties.route.distance)
const totalDistanceStr = _.round(_.sum(distances) * METERS_TO_MILES, 1)
const longestDistanceStr = _.round(_.max(distances)! * METERS_TO_MILES, 1)

document.getElementById('total-stats')!.innerHTML =
  `# Rides: ${numRoutes}<br>Total Distance: ${totalDistanceStr}mi<br>Longest Ride: ${longestDistanceStr}mi`
