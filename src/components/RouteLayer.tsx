import { type LayerGroup as LayerGroupType } from 'leaflet'
import { DateTime } from 'luxon'
import { LayerGroup } from 'react-leaflet'
import { type CustomWorkout } from '../types'
import { Route, type RouteProps } from './Route'

export interface RouteLayerProps extends Pick<RouteProps, 'color' | 'hoverColor'> {
  data: CustomWorkout[]
  layerRef: React.Ref<LayerGroupType>
}

export const RouteLayer = ({ data, color, hoverColor, layerRef }: RouteLayerProps) => {
  return (
    <LayerGroup ref={layerRef}>
      {data.map(({ workout, route, geoJson }) => {
        const id=workout.start_datetime
        return (
          <Route
            key={id}
            id={id}
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
