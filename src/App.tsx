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
import { HoveredRouteProvider } from './components/HoveredRouteContext'
import { RouteLayer } from './components/RouteLayer'
import { METERS_TO_MILES } from './constants'
import { useWorkouts } from './hooks/useWorkouts'
import { type CustomWorkout } from './types'
import { ActivityName } from './types/mapMyRide'
import { getEnv } from './utils'

const { MAPTILER_API_KEY } = getEnv('MAPTILER_API_KEY')

const MapHandlers = ({ ...handlers }: LeafletEventHandlerFnMap) => {
  useMapEvents(handlers)
  return null
}

const HeaderSubtitle = ({ data }: { data: CustomWorkout[] | null }) => {
  if (data === null) {
    return
  }
  if (data.length == 0) {
    return <b className="error-text">No data! Select layers!</b>
  }

  const numRoutes = data.length
  const distances = data.map(({ route }) => route.distance)

  return (
    <>
      # Routes: {numRoutes}
      <br />
      Total Distance: {round(sum(distances) * METERS_TO_MILES, 1)}mi
      <br />
      Longest Route: {round(max(distances)! * METERS_TO_MILES, 1)}mi
    </>
  )
}

export const App = () => {
  const mapRef = useRef<Map>(null)
  const [isSatellite, setIsSatellite] = useState<boolean>(false)
  const [visibleData, setVisibleData] = useState<CustomWorkout[] | null>(null)
  const { workouts: allWorkouts, isLoading, total } = useWorkouts()

  const bikeLayerRef = useRef<LayerGroupType>(null)
  const walkLayerRef = useRef<LayerGroupType>(null)

  const layerData = useMemo(
    () =>
      allWorkouts.length == 0
        ? []
        : [
            {
              name: 'Bike Records',
              data: allWorkouts.filter((g) =>
                [ActivityName.BIKE_RIDE, ActivityName.ROAD_CYCLING].includes(g.activityType.name),
              ),
              layerRef: bikeLayerRef,
            },
            {
              name: 'Walk Records',
              data: allWorkouts.filter((g) =>
                [ActivityName.RUN, ActivityName.WALK].includes(g.activityType.name),
              ),
              layerRef: walkLayerRef,
            },
          ],
    [allWorkouts],
  )

  const changeVisibleData = () => {
    const mapRefMap = mapRef.current
    if (!mapRefMap || layerData.length == 0) return
    setVisibleData(
      layerData
        .filter(({ layerRef }) => layerRef.current && mapRefMap.hasLayer(layerRef.current))
        .flatMap(({ data }) => data),
    )
  }

  useEffect(() => {
    changeVisibleData()
  }, [mapRef.current])

  useEffect(() => {
    changeVisibleData()
  }, [layerData])

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
          <div id="header-subtitle">
            <HeaderSubtitle data={visibleData} />
            {isLoading && (
              <div className="loading-routes-text">
                Loading Routes... {total && `${allWorkouts?.length}/${total}`}
              </div>
            )}
          </div>
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
          <HoveredRouteProvider>
            {layerData.map(({ name, data, layerRef }) => (
              <LayersControl.Overlay name={name} checked key={name}>
                <RouteLayer
                  data={data}
                  layerRef={layerRef}
                  color={isSatellite ? 'magenta' : 'lime'}
                  hoverColor={isSatellite ? 'yellow' : 'orangered'}
                />
              </LayersControl.Overlay>
            ))}
          </HoveredRouteProvider>
        </LayersControl>
      </MapContainer>
    </>
  )
}
