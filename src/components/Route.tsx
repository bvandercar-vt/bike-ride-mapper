import { round } from 'es-toolkit'
import {
  type GeoJSON as GeoJSONType,
  Symbol as LeafletSymbol,
  type PathOptions,
  type Polyline,
  type PolylineDecorator,
  polylineDecorator,
} from 'leaflet'
import type { DateTime } from 'luxon'
import { useCallback, useEffect, useRef } from 'react'
import { GeoJSON, type GeoJSONProps, Tooltip, useMap } from 'react-leaflet'
import { METERS_TO_FEET, METERS_TO_MILES } from '../constants'
import type { Route as RouteType } from '../types/mapMyRide'
import { useHoveredRoute } from './HoveredRouteProvider'

export interface RouteProps extends Pick<GeoJSONProps, 'data'> {
  id: string
  date: DateTime
  route: Pick<RouteType, 'distance' | 'total_ascent'>
  color: string
  hoverColor: string
}

export const Route = ({
  id,
  data,
  date,
  route,
  color,
  hoverColor,
}: RouteProps) => {
  const map = useMap()
  const { hoveredRouteId, setHoveredRouteId } = useHoveredRoute()
  const isHovered = hoveredRouteId === id
  const lineRef = useRef<GeoJSONType>(null)
  const hoverLineRef = useRef<GeoJSONType>(null)
  const arrowsDecorator = useRef<PolylineDecorator>()

  const style: PathOptions = isHovered
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

  const arrow = LeafletSymbol.arrowHead({
    pixelSize: 13,
    pathOptions: {
      fillOpacity: style.opacity,
      color: style.color,
      weight: 0,
    },
  })

  const addArrows = useCallback(() => {
    const lineLayer = lineRef.current?.getLayers()[0]
    if (!lineLayer) return
    arrowsDecorator.current = polylineDecorator(lineLayer as Polyline, {
      patterns: [{ repeat: 60, symbol: arrow }],
    }).addTo(map)
  }, [map, arrow])

  const removeArrows = useCallback(() => {
    arrowsDecorator.current?.remove()
    arrowsDecorator.current = undefined
  }, [])

  useEffect(() => {
    if (isHovered) {
      addArrows()
      lineRef.current?.bringToFront()
      hoverLineRef.current?.bringToFront()
    } else {
      removeArrows()
    }
    return () => {
      removeArrows()
    }
  }, [isHovered, addArrows, removeArrows])

  const handleMouseOver = () => setHoveredRouteId(id)
  const handleMouseOut = () => setHoveredRouteId(null)

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
          mouseover: handleMouseOver,
          mouseout: handleMouseOut,
        }}
      >
        {isHovered && (
          <Tooltip
            className="text-xs m-0 px-2 py-0"
            direction="top"
            sticky={true}
          >
            <b>{date.toFormat('EEE. MMMM d, yyyy h:mma')}</b>
            <br />
            <i>
              <b>Distance: {round(route.distance * METERS_TO_MILES, 1)}mi</b>
            </i>
            <br />
            <i>
              Total Ascent: {round(route.total_ascent * METERS_TO_FEET, 0)}ft
            </i>
          </Tooltip>
        )}
      </GeoJSON>
    </>
  )
}
