import { baseEnv, loadEnv } from '@collabo/service-kit'
import { z } from 'zod'

export const env = loadEnv(
  baseEnv.extend({
    VALKEY_LIVE_URL: z.url(),
    VALKEY_DURABLE_URL: z.url(),
    JWKS_URL: z.url(),
    JWT_ISSUER: z.string().min(1),
    JWT_AUDIENCE: z.string().min(1),
    TRIP_URL: z.url(),
  }),
)
