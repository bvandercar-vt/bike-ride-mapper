import 'leaflet/dist/leaflet.css'
import './styles/index.css'

import {
  latLng,
  type LayerGroup as LayerGroupType,
  type LeafletEventHandlerFnMap,
  type Map,
} from 'leaflet'
import 'leaflet-polylinedecorator'
import { max, round, sum } from 'lodash'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LayersControl, MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import geoJsons_ from '../geoJsons.json'
import { RouteLayer } from './components/RouteLayer'
import { METERS_TO_MILES } from './constants'
import { ActivityName, type CustomGeoJson } from './types/mapMyRide'

const geoJsons = geoJsons_ as CustomGeoJson[]

const { MAPTILER_API_KEY } = process.env
if (!MAPTILER_API_KEY) {
  console.error(process.env)
  throw new Error('need env file')
}

const MapHandlers = ({ ...handlers }: LeafletEventHandlerFnMap) => {
  useMapEvents(handlers)
  return null
}

const Stats = ({ data }: { data: CustomGeoJson['properties'][] }) => {
  const numRoutes = data.length
  const distances = data.map(({ route }) => route.distance)

  return (
    <div id="total-stats">
      {numRoutes === 0 ? (
        <b className="error-text">
          No data layers selected!
          <br />
          Select some!
        </b>
      ) : (
        <>
          # Routes: {numRoutes}
          <br />
          Total Distance: {round(sum(distances) * METERS_TO_MILES, 1)}mi
          <br />
          Longest Route: {round(max(distances)! * METERS_TO_MILES, 1)}mi
        </>
      )}
    </div>
  )
}

export const App = () => {
  const mapRef = useRef<Map>(null)
  const [isSatellite, setIsSatellite] = useState<boolean>(false)
  const [visibleData, setVisibleData] = useState<CustomGeoJson['properties'][]>([])

  function setBikeTrailsStyle() {
    const bikeTrails = document.getElementsByClassName('bike-trails')[0]
    if (!bikeTrails) return
    bikeTrails.classList.toggle('bike-trails-satellite', isSatellite)
    bikeTrails.classList.toggle('bike-trails-dark', !isSatellite)
  }

  useEffect(setBikeTrailsStyle, [isSatellite])

  const layerData_ = useMemo(
    () => [
      {
        name: 'Bike Records',
        data: geoJsons.filter((g) =>
          [ActivityName.BIKE_RIDE].includes(g.properties.activityType.name),
        ),
      },
      {
        name: 'Walk Records',
        data: geoJsons.filter((g) =>
          [ActivityName.RUN, ActivityName.WALK].includes(g.properties.activityType.name),
        ),
      },
    ],
    [],
  )

  const layerData = layerData_.map((d) => ({ ...d, layerRef: useRef<LayerGroupType>(null) }))

  const changeVisibleData = () => {
    setVisibleData(
      layerData
        .filter(({ layerRef }) => layerRef.current && mapRef.current?.hasLayer(layerRef.current))
        .flatMap(({ data }) => data.map((d) => d.properties)),
    )
  }

  useEffect(() => changeVisibleData(), [mapRef.current])

  return (
    <>
      <header>
        <div id="header-text">
          <h1>My Bike Rides</h1>
          <br />
          {mapRef.current && <Stats data={visibleData} />}
        </div>
      </header>
      <MapContainer
        center={latLng(39.7327258, -104.9851469)}
        zoom={13}
        zoomControl={false}
        id="map"
        ref={mapRef}
      >
        <MapHandlers
          baselayerchange={(e) => {
            setIsSatellite(e.name === 'Satellite')
          }}
          overlayadd={() => {
            setBikeTrailsStyle()
            changeVisibleData()
          }}
          overlayremove={() => {
            changeVisibleData()
          }}
        />
        <LayersControl position="topleft" collapsed={false}>
          <LayersControl.BaseLayer name="Default" checked>
            <TileLayer
              url={`https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`}
              tileSize={512}
              zoomOffset={-1}
              minZoom={1}
              crossOrigin={true}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              url={`https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAPTILER_API_KEY}`}
              tileSize={512}
              zoomOffset={-1}
              minZoom={1}
              crossOrigin={true}
            />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay name="Bike Trails">
            <TileLayer
              url={'http://{s}.google.com/vt/lyrs=bike&x={x}&y={y}&z={z}'}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              opacity={0.5}
              maxZoom={20}
              className="bike-trails"
            />
          </LayersControl.Overlay>
          {layerData.map(({ name, data, layerRef }) => (
            <LayersControl.Overlay name={name} checked>
              <RouteLayer
                key={name}
                data={data}
                layerRef={layerRef}
                color={isSatellite ? 'magenta' : 'lime'}
                hoverColor={isSatellite ? 'yellow' : 'orangered'}
              />
            </LayersControl.Overlay>
          ))}
        </LayersControl>
      </MapContainer>
    </>
  )
}
