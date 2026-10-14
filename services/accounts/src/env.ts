import { baseEnv, loadEnv } from '@collabo/service-kit'
import { z } from 'zod'

export const env = loadEnv(
  baseEnv.extend({
    DATABASE_URL: z.url(),
    VALKEY_LIVE_URL: z.url(),
    VALKEY_DURABLE_URL: z.url(),
  }),
)
