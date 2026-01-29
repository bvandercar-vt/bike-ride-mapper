import {
  createClient as createSanityClient,
  type SanityClient as SanityJsClient,
} from '@sanity/client'
import { getEnv } from '../utils'

const { SANITY_API_TOKEN_READ, SANITY_PROJECT_ID } = getEnv(
  'SANITY_API_TOKEN_READ',
  'SANITY_PROJECT_ID',
)

export class SanityClientBase {
  public client: SanityJsClient

  constructor() {
    this.client = createSanityClient({
      projectId: SANITY_PROJECT_ID,
      dataset: 'production',
      token: SANITY_API_TOKEN_READ,
      apiVersion: '2025-07-29',
      useCdn: false,
    })
  }

  /**
   * Generic batch getter for Sanity queries.
   * @param filter GROQ filter string
   * @param batchSize Number of items per batch
   * @yields { batch, total }
   */
  async *getBatches<R>(
    filter: string,
    batchSize: number,
  ): AsyncGenerator<{ batch: R[]; total: number }, void, unknown> {
    let offset = 0
    let total: number | undefined = undefined

    while (true) {
      let items: R[] = []
      if (offset === 0) {
        const query = `{
          "items": *[${filter}][0...${batchSize}],
          "total": count(*[${filter}])
        }`
        const result = await this.client.fetch<{ items: R[]; total: number }>(query)
        items = result.items
        total = result.total
      } else {
        const query = `*[${filter}][${offset}...${offset + batchSize}]`
        items = await this.client.fetch<R[]>(query)
      }

      if (items.length === 0) {
        break
      }

      yield {
        batch: items,
        total: total!,
      }

      if (items.length < batchSize) {
        break
      }

      offset += batchSize
    }
  }
}
