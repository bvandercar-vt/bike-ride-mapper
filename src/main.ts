/**
 * CSS Imports -- ORDER MATTERS
 */
import 'leaflet/dist/leaflet.css'
import './styles/index.css'

/**
 * Regular imports
 */
import { latLng, map, tileLayer } from 'leaflet'

const mymap = map('map', {
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
}).addTo(mymap)
