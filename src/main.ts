/**
 * CSS Imports -- ORDER MATTERS
 */
import 'leaflet/dist/leaflet.css'
import './styles/index.css'

/**
 * Regular imports
 */
import {
  LayerGroup,
  Symbol,
  control,
  map as createMap,
  geoJSON,
  latLng,
  layerGroup,
  polylineDecorator,
  tileLayer,
  type PathOptions,
  type PolylineDecorator,
} from 'leaflet'
import 'leaflet-polylinedecorator'
import _ from 'lodash'
import { DateTime } from 'luxon'
import { ActivityName, type CustomGeoJson } from './types/mapMyRide'

const METERS_TO_MILES = 0.000621371
const METERS_TO_FEET = 3.28084

const map = createMap('map', {
  center: latLng(39.7327258, -104.9851469),
  zoom: 13,
  zoomControl: false,
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
  'GMaps Bike Trails': trailLayer,
}

const layerControl = control
  .layers(baseMaps, overlayMaps, { position: 'topleft', collapsed: false })
  .addTo(map)

function setBikeTrailsStyle(isSatellite: boolean) {
  const bikeTrails = document.getElementsByClassName('bike-trails')[0]
  if (!bikeTrails) return
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

enum RecordLayerKeys {
  BIKE_RECORDS = 'Bike Records',
  WALK_RECORDS = 'Walk Records',
}

const geoJsonLayers: Record<
  RecordLayerKeys,
  { layerGroup: LayerGroup; data: Array<CustomGeoJson['properties']> }
> = Object.fromEntries(
  Object.values(RecordLayerKeys).map((key) => [key, { layerGroup: layerGroup(), data: [] }]),
)

const ActivityNameToLayerMap = {
  [ActivityName.BIKE_RIDE]: RecordLayerKeys.BIKE_RECORDS,
  [ActivityName.RUN]: RecordLayerKeys.WALK_RECORDS,
  [ActivityName.WALK]: RecordLayerKeys.WALK_RECORDS,
} satisfies Record<ActivityName, RecordLayerKeys>

geoJsons.forEach((geoJson) => {
  const { workout, route, activityType } = geoJson.properties

  const geoJsonLayer = geoJsonLayers[ActivityNameToLayerMap[activityType.name]]
  geoJsonLayer.data.push(geoJson.properties)

  // Popover tooltip
  const date = DateTime.fromISO(workout.start_datetime)
  const dateStr = date.toFormat('EEE. MMMM d, yyyy h:mma')
  const distanceStr = _.round(route.distance * METERS_TO_MILES, 1)
  const ascentStr = _.round(route.total_ascent * METERS_TO_FEET, 0)
  const popover = document.createElement('div')
  popover.classList.add('route-popover')
  popover.innerHTML = `<b>${dateStr}</b>
  <br><i><b>Distance: ${distanceStr}mi</b></i>
  <br><i>Total Ascent: ${ascentStr}ft</i>`

  // create the route features
  const feature = geoJSON(geoJson, {
    style: lineStyle,
    filter: (feature) => feature.geometry.type !== 'Point',
  }).addTo(geoJsonLayer.layerGroup)
  const featureHover = geoJSON(geoJson, {
    style: { weight: 30, opacity: 0 },
    filter: (feature) => feature.geometry.type !== 'Point',
  }).addTo(geoJsonLayer.layerGroup)
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

Object.entries(geoJsonLayers).map(([key, { layerGroup }]) => {
  layerControl.addOverlay(layerGroup.addTo(map), key)
})

function setTotalStats() {
  const visibleData: Array<CustomGeoJson['properties']> = Object.values(geoJsonLayers)
    .filter(({ layerGroup }) => map.hasLayer(layerGroup))
    .flatMap(({ data }) => data)

  const numRoutes = visibleData.length
  const distances = visibleData.map(({ route }) => route.distance)
  const totalDistanceStr = _.round(_.sum(distances) * METERS_TO_MILES, 1)
  const longestDistanceStr = _.round(_.max(distances)! * METERS_TO_MILES, 1)

  document.getElementById('total-stats')!.innerHTML =
    numRoutes === 0
      ? '<b class="error-text">No data layers selected!<br>Select some!</b>'
      : `# Routes: ${numRoutes}<br>Total Distance: ${totalDistanceStr}mi<br>Longest Route: ${longestDistanceStr}mi`
}

map.on('overlayadd', setTotalStats)
map.on('overlayremove', setTotalStats)

setTotalStats()
