import dotenv from 'dotenv'

// Only load .env in Node (e.g. get-data scripts). In the browser, dotenv uses process.cwd() which doesn't exist.
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  const result = dotenv.config({ path: '.env.local' })
  if (result.parsed) {
    console.log('loaded .env.local for environment variables')
  }
}

export function getEnv<Keys extends string[]>(...keys: Keys) {
  return Object.fromEntries(
    keys.map((key) => {
      const value = process.env[key]

      if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`Missing required environment variable: ${key}`)
      }
      return [key, value]
    }),
  ) as Record<Keys[number], string>
}
