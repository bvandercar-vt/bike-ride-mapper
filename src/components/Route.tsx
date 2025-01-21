import { type GeoJSON as GeoJSONType } from 'leaflet'
import { round } from 'lodash'
import { type DateTime } from 'luxon'
import { useRef, useState } from 'react'
import { GeoJSON, type GeoJSONProps, Tooltip } from 'react-leaflet'
import { METERS_TO_FEET, METERS_TO_MILES } from '../constants'
import { type Route as RouteType } from '../types/mapMyRide'

export interface RouteProps extends Pick<GeoJSONProps, 'data'> {
  date: DateTime
  route: Pick<RouteType, 'distance' | 'total_ascent'>
  color: string
  hoverColor: string
}

export const Route = ({ data, date, route, color, hoverColor }: RouteProps) => {
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const lineRef = useRef<GeoJSONType>(null)
  const hoverLineRef = useRef<GeoJSONType>(null)

  const style = isHovered
    ? {
        color: hoverColor,
        weight: 5,
        opacity: 0.6,
      }
    : {
        color,
        weight: 3,
        opacity: 0.45,
      }

  return (
    <>
      <GeoJSON
        ref={lineRef}
        data={data}
        style={style}
        filter={(feature) => feature.geometry.type !== 'Point'}
      />
      <GeoJSON
        ref={hoverLineRef}
        data={data}
        style={{ weight: 30, opacity: 0 }}
        filter={(feature) => feature.geometry.type !== 'Point'}
        eventHandlers={{
          mouseover: () => {
            setIsHovered(true)
            lineRef.current?.bringToFront()
            hoverLineRef.current?.bringToFront()
          },
          mouseout: () => {
            setIsHovered(false)
          },
        }}
      >
        <Tooltip className="route-popover" direction="top" sticky={true}>
          <b>{date.toFormat('EEE. MMMM d, yyyy h:mma')}</b>
          <br />
          <i>
            <b>Distance: {round(route.distance * METERS_TO_MILES, 1)}mi</b>
          </i>
          <br />
          <i>Total Ascent: {round(route.total_ascent * METERS_TO_FEET, 0)}ft</i>
        </Tooltip>
      </GeoJSON>
    </>
  )
}
