import dotenv from 'dotenv'

// Only load .env in Node (e.g. get-data scripts). In the browser, dotenv uses process.cwd() which doesn't exist.
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  const result = dotenv.config({ path: '.env.local' })
  if (result.parsed) {
    console.log('loaded .env.local for environment variables')
  }
}

export { getEnv } from '../../src/utils/get-env'
