/**
 * CSS Imports -- ORDER MATTERS
 */
import 'leaflet/dist/leaflet.css'
import './styles/index.css'

/**
 * Regular imports
 */
import {
  PathOptions,
  map as createMap,
  geoJSON,
  latLng,
  popup,
  tileLayer,
  type Popup,
} from 'leaflet'
import _ from 'lodash'
import { CustomGeoJson } from './mapMyRide'

const map = createMap('map', {
  center: latLng(39.7327258, -104.9851469),
  zoom: 13,
})

const { MAPTILER_API_KEY } = process.env

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
  opacity: 0.5,
}

const geoJsons: CustomGeoJson[] = await fetch('../workout_geojsons/geoJsons.json').then((r) =>
  r.json(),
)
geoJsons.forEach(async (geoJson) => {
  const feature = geoJSON(geoJson, {
    style: lineStyle,
    filter: (feature) => feature.geometry.type !== 'Point',
  }).addTo(map)

  const date = new Date(geoJson.properties.start_datetime)
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

  var layerPopup: Popup | null
  feature.on('mouseover', function (e) {
    layerPopup = popup()
      .setLatLng(e.latlng)
      .setContent(
        `Date: ${dateStr}<br>Distance: ${_.round(geoJson.properties.aggregates.distance_total * 0.000621371, 2)} miles`,
      )
      .openOn(map)

    feature.setStyle(lineStyleHovered)
    feature.bringToFront()
  })
  feature.on('mouseout', function (e) {
    if (layerPopup) {
      map.closePopup(layerPopup)
      layerPopup = null
    }
    feature.setStyle(lineStyle)
  })
})
