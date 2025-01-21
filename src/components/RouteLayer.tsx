import { type LayerGroup as LayerGroupType } from 'leaflet'
import { DateTime } from 'luxon'
import { LayerGroup } from 'react-leaflet'
import { type CustomGeoJson } from '../types/mapMyRide'
import { Route, type RouteProps } from './Route'

export interface RouteLayerProps extends Pick<RouteProps, 'color' | 'hoverColor'> {
  data: CustomGeoJson[]
  layerRef: React.Ref<LayerGroupType>
}

export const RouteLayer = ({ data, color, hoverColor, layerRef }: RouteLayerProps) => {
  return (
    <LayerGroup ref={layerRef}>
      {data.map((geoJson, index) => {
        const { workout, route } = geoJson.properties
        return (
          <Route
            key={index}
            data={geoJson}
            date={DateTime.fromISO(workout.start_datetime)}
            route={route}
            color={color}
            hoverColor={hoverColor}
          />
        )
      })}
    </LayerGroup>
  )
}
