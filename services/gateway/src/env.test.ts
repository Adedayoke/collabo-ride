import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const required = {
  SERVICE_NAME: 'gateway',
  PORT: '8080',
  GATEWAY_CONTEXT_KEY: 'test-gateway-context-key-0123456789abcdef',
  VALKEY_LIVE_URL: 'redis://localhost:6379',
  JWKS_URL: 'http://localhost:8081/api/auth/jwks',
  JWT_ISSUER: 'http://localhost:8081',
  JWT_AUDIENCE: 'collabo-api',
  ACCOUNTS_URL: 'http://localhost:8081',
  TRIP_URL: 'http://localhost:8082',
  DISPATCH_URL: 'http://localhost:8083',
  PAYMENTS_URL: 'http://localhost:8084',
  NOTIFICATIONS_URL: 'http://localhost:8085',
  FRAUD_URL: 'http://localhost:8087',
}

function stub(env: Record<string, string | undefined>) {
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value)
}

beforeEach(() => {
  vi.resetModules()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${code})`)
  })
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('gateway env', () => {
  it('boots with every required variable set', async () => {
    stub(required)
    const { env } = await import('./env')
    expect(env).toMatchObject({ SERVICE_NAME: 'gateway', PORT: 8080 })
  })

  it.each(['VALKEY_LIVE_URL', 'JWKS_URL', 'JWT_ISSUER', 'JWT_AUDIENCE', 'ACCOUNTS_URL', 'TRIP_URL', 'DISPATCH_URL', 'PAYMENTS_URL', 'NOTIFICATIONS_URL', 'FRAUD_URL', 'SERVICE_NAME', 'PORT', 'GATEWAY_CONTEXT_KEY'])('exits at start and names %s when it is missing', async (name) => {
    stub({ ...required, [name]: undefined })
    await expect(import('./env')).rejects.toThrow('process.exit(1)')
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining(name))
  })
})
