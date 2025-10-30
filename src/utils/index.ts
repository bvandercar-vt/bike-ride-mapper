import dotenv from 'dotenv'

if (typeof process !== 'undefined' && process.env.SANITY_API_TOKEN_WRITE === undefined) {
  await dotenv.config({ path: '.env.local' })
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
