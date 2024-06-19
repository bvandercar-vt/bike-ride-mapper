import { config } from 'dotenv'
import * as fs from 'fs'
import sanitize from 'sanitize-filename'

config({ path: '.env.local' })

const API_URL = 'https://mapmyride.api.ua.com'

const DIR = 'ride_files'

interface Route {
  city: string
  country: string
  state: string
  starting_location: string
  start_point_type: string
  postal_code: string
  distance: string
  name: string
  description: string
  data_source: string
  images: string
  created_datetime: string
  updated_datetime: string
  points: string
  climbs: string
  total_ascent: string
  total_descent: string
  min_elevation: string
  max_elevation: string
  _links: Record<
    'alternate' | 'privacy' | 'self' | 'activity_types' | 'user' | 'thumbnail' | 'documentation',
    Array<{ href: string; id?: string; name?: string }>
  >
}

const downloadAllRoutes = async (token: string, user_id: string) => {
  async function get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        authorization: token,
      },
    })
    if (!response.ok)
      throw new Error(
        `Failed to get from endpoint ${endpoint}. Status: ${response.status} ${response.statusText} ${await response.text()}`,
      )
    return response
  }

  async function getRoutes(limit: number, offset: number) {
    const response = await get(
      `/v7.2/route/?` +
        new URLSearchParams({
          limit: String(limit),
          offset: String(offset),
          user: user_id,
          order_by: 'date_created',
        }),
    )
    const result = await response.json()
    return result._embedded.routes as Route[]
  }

  const rides: Route[] = []
  while (rides.length % 10 == 0) {
    const newRides = await getRoutes(10, rides.length)
    rides.push(...newRides)
  }

  if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR)
  }

  rides.forEach(async (ride) => {
    const response = await get(ride._links.alternate[0].href)
    const result = await response.arrayBuffer()
    fs.writeFileSync(`${DIR}/${sanitize(ride.name)}.kml`, Buffer.from(result))
  })
}

const { MMR_AUTH_TOKEN, MMR_USER_ID } = process.env
if (!MMR_AUTH_TOKEN || !MMR_USER_ID) throw new Error('need env file')

console.log(MMR_AUTH_TOKEN)
console.log(MMR_USER_ID)

await downloadAllRoutes(MMR_AUTH_TOKEN, MMR_USER_ID)
