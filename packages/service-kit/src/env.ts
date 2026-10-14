import { z } from 'zod'

/** Variables every service validates at boot (spec 0009, Configuration required). */
export const baseEnv = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SERVICE_NAME: z.string().min(1),
  PORT: z.coerce.number().int().positive(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  GATEWAY_CONTEXT_KEY: z.string().min(32, 'must be at least 32 characters'),
})

export type BaseEnv = z.infer<typeof baseEnv>

/**
 * Parse process.env against a schema. A missing or wrong value stops the
 * process at start with every problem listed, never mid trip.
 */
export function loadEnv<S extends z.ZodType>(schema: S, source: NodeJS.ProcessEnv = process.env): z.infer<S> {
  const result = schema.safeParse(source)
  if (!result.success) {
    const lines = result.error.issues.map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    console.error(`Invalid environment:\n${lines.join('\n')}`)
    process.exit(1)
  }
  return result.data
}
