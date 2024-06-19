import { config } from 'dotenv'
import * as fs from 'fs'
import sanitize from 'sanitize-filename'

config({ path: '.env.local' })

const API_URL = 'https://mapmyride.api.ua.com'

const DIR = 'ride_files'

const get_rides = async (token: string, user_id: string) => {
  const get = async (limit: number, offset: number) => {
    const response = await fetch(
      `${API_URL}/v7.2/route/?` +
        new URLSearchParams({
          limit: String(limit),
          offset: String(offset),
          user: user_id,
          order_by: 'date_created',
        }),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          authorization: token,
        },
      },
    )
    if (!response.ok)
      throw new Error(
        `Failed to get ride list! status: ${response.status}${response.statusText}${await response.text()}`,
      )
    const result = await response.json()
    return result._embedded.routes
  }

  const rides = []

  while (rides.length % 10 == 0) {
    const new_rides = await get(10, rides.length)
    rides.push(...new_rides)
  }

  rides.forEach(async (ride) => {
    const response = await fetch(API_URL + ride._links.alternate[0].href, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        authorization: token,
      },
    })
    if (!response.ok)
      throw new Error(
        `Failed to get ride list! status: ${response.status}${response.statusText}${await response.text()}`,
      )
    const result = await response.arrayBuffer()
    if (!fs.existsSync(DIR)) {
      fs.mkdirSync(DIR)
    }
    fs.writeFileSync(`${DIR}/${sanitize(ride.name)}.kml`, Buffer.from(result))
  })
}

const { MMR_AUTH_TOKEN, MMR_USER_ID } = process.env
if (!MMR_AUTH_TOKEN || !MMR_USER_ID) throw new Error('need env file')

console.log(MMR_AUTH_TOKEN)
console.log(MMR_USER_ID)

await get_rides(MMR_AUTH_TOKEN, MMR_USER_ID)
