import type {
  ActivityType,
  OAuthResponse,
  Route,
  Workout,
} from '../../src/types/mapMyRide'
import { getEnv } from '../../src/utils/get-env'
import { getInput } from '../utils/get-input'

export class MapMyRideClient {
  public static readonly MMR_API_URL: string = 'https://api.mapmyfitness.com'
  private readonly CLIENT_ID: string
  private readonly apiKeyHeader: { 'Api-Key': string }
  private readonly authHeader: { Authorization: string }

  constructor() {
    const { MMR_CLIENT_ID, MMR_AUTH_TOKEN } = getEnv(
      'MMR_CLIENT_ID',
      'MMR_AUTH_TOKEN',
    )
    this.CLIENT_ID = MMR_CLIENT_ID
    this.apiKeyHeader = { 'Api-Key': MMR_CLIENT_ID }
    this.authHeader = { Authorization: `Bearer ${MMR_AUTH_TOKEN}` }
  }

  async request(endpoint: string, args: RequestInit) {
    try {
      const response = await fetch(
        `${MapMyRideClient.MMR_API_URL}${endpoint}`,
        args,
      )

      if (!response.ok) {
        throw new Error(
          `Failed to get from endpoint ${endpoint}\nStatus: ${response.status} ${response.statusText}\nResponse: ${await response.text()}`,
        )
      }

      return response
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err)
      throw err
    }
  }

  async get(endpoint: string) {
    return await this.request(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeader,
        ...this.apiKeyHeader,
      },
    })
  }

  async getOAuthToken(params: {
    grant_type: 'authorization_code' | 'client_credentials' | 'refresh_token'
    code?: string
    refresh_token?: string
  }) {
    const { MMR_CLIENT_SECRET } = getEnv('MMR_CLIENT_SECRET')
    const response: OAuthResponse = await this.request(
      '/v7.2/oauth2/access_token/',
      {
        method: 'POST',
        headers: {
          ...this.apiKeyHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          ...params,
          client_id: this.CLIENT_ID,
          client_secret: MMR_CLIENT_SECRET,
        }),
      },
    ).then((r) => r.json())
    return response
  }

  async printAuthToken() {
    const baseUrl = 'https://www.mapmyfitness.com/oauth2/authorize/'
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      response_type: 'code',
      redirect_uri: 'http://www.google.com',
    })
    console.log(`${baseUrl}?${params.toString()}`)
    console.log('The code is in the code param at the URL')
    const code = await getInput('Enter the code: ')
    const tokenResponse = await this.getOAuthToken({
      grant_type: 'authorization_code',
      code,
    })

    console.log(
      'Enter to environment MMR_AUTH_TOKEN :\n',
      tokenResponse.access_token,
    )
    console.log(`Expires in: ${tokenResponse.expires_in / (24 * 60 * 60)} days`)
    process.exit(0)
  }

  async getAll<T>(
    endpoint: string,
    key: string,
    params: Record<string, string>,
  ) {
    const getBatch = async (limit: number, offset: number) => {
      const response = await this.get(
        `/v7.2/${endpoint}/?` +
          new URLSearchParams({
            limit: String(limit),
            offset: String(offset),
            ...params,
          }),
      ).then((r) => r.json())
      return response._embedded[key] as T[]
    }

    const items: T[] = []
    while (true) {
      const newItems = await getBatch(10, items.length)
      if (newItems.length === 0) break
      items.push(...newItems)
    }

    return items
  }

  async getWorkouts({ user_id }: { user_id: string }) {
    return await this.getAll<Workout>('workout', 'workouts', {
      user: user_id,
      order_by: 'start_datetime',
    })
  }

  async getRoute(workout: Workout): Promise<Route> {
    return await this.get(workout._links.route[0].href).then((r) => r.json())
  }

  async getActivityType(workout: Workout): Promise<ActivityType> {
    return await this.get(workout._links.activity_type[0].href).then((r) =>
      r.json(),
    )
  }

  async getRoutePathData(route: Route, type: 'gpx' | 'kml') {
    return await this.get(
      // biome-ignore lint/style/noNonNullAssertion: always present
      route._links.alternate.find((l) => l.name === type)!.href,
    ).then((r) => r.text())
  }
}
