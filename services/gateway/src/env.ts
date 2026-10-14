import { baseEnv, loadEnv } from '@collabo/service-kit'
import { z } from 'zod'

export const env = loadEnv(
  baseEnv.extend({
    VALKEY_LIVE_URL: z.url(),
    JWKS_URL: z.url(),
    JWT_ISSUER: z.string().min(1),
    JWT_AUDIENCE: z.string().min(1),
    ACCOUNTS_URL: z.url(),
    TRIP_URL: z.url(),
    DISPATCH_URL: z.url(),
    PAYMENTS_URL: z.url(),
    NOTIFICATIONS_URL: z.url(),
    FRAUD_URL: z.url(),
  }),
)
