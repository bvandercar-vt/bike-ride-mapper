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
import { getWorkouts } from './api/sanity.api'
import { RouteLayer } from './components/RouteLayer'
import { METERS_TO_MILES } from './constants'
import { type CustomWorkout } from './types'
import { ActivityName } from './types/mapMyRide'
import { getEnv } from './utils'

const { MAPTILER_API_KEY } = getEnv('MAPTILER_API_KEY')

const MapHandlers = ({ ...handlers }: LeafletEventHandlerFnMap) => {
  useMapEvents(handlers)
  return null
}

const Stats = ({ data }: { data: CustomWorkout[] | null }) => {
  if (data === null) return

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
  const [allData, setAllData] = useState<CustomWorkout[] | null>(null)
  const [visibleData, setVisibleData] = useState<CustomWorkout[] | null>(null)

  const bikeLayerRef = useRef<LayerGroupType>(null)
  const walkLayerRef = useRef<LayerGroupType>(null)

  useEffect(() => {
    getWorkouts().then((data) => setAllData(data))
  }, [])

  const layerData = useMemo(
    () =>
      allData
        ? [
            {
              name: 'Bike Records',
              data: allData.filter((g) =>
                [ActivityName.BIKE_RIDE, ActivityName.ROAD_CYCLING].includes(g.activityType.name),
              ),
              layerRef: bikeLayerRef,
            },
            {
              name: 'Walk Records',
              data: allData.filter((g) =>
                [ActivityName.RUN, ActivityName.WALK].includes(g.activityType.name),
              ),
              layerRef: walkLayerRef,
            },
          ]
        : null,
    [allData],
  )

  const changeVisibleData = () => {
    const mapRefMap = mapRef.current
    if (!mapRefMap || !layerData) return
    setVisibleData(
      layerData
        .filter(({ layerRef }) => layerRef.current && mapRefMap.hasLayer(layerRef.current))
        .flatMap(({ data }) => data),
    )
  }

  useEffect(() => {
    changeVisibleData()
  }, [mapRef.current])

  function setBikeTrailsStyle() {
    const bikeTrails = document.getElementsByClassName('bike-trails')[0]
    if (!bikeTrails) return
    bikeTrails.classList.toggle('bike-trails-satellite', isSatellite)
    bikeTrails.classList.toggle('bike-trails-dark', !isSatellite)
  }

  useEffect(() => {
    setBikeTrailsStyle()
  }, [isSatellite])

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
          {layerData?.map(({ name, data, layerRef }) => (
            <LayersControl.Overlay name={name} checked key={name}>
              <RouteLayer
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
