import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const required = {
  SERVICE_NAME: 'notifications',
  PORT: '8085',
  GATEWAY_CONTEXT_KEY: 'test-gateway-context-key-0123456789abcdef',
  DATABASE_URL: 'postgres://notifications:pw@localhost:5432/collabo',
  VALKEY_DURABLE_URL: 'redis://localhost:6380',
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

describe('notifications env', () => {
  it('boots with every required variable set', async () => {
    stub(required)
    const { env } = await import('./env')
    expect(env).toMatchObject({ SERVICE_NAME: 'notifications', PORT: 8085 })
  })

  it.each(['DATABASE_URL', 'VALKEY_DURABLE_URL', 'SERVICE_NAME', 'PORT', 'GATEWAY_CONTEXT_KEY'])('exits at start and names %s when it is missing', async (name) => {
    stub({ ...required, [name]: undefined })
    await expect(import('./env')).rejects.toThrow('process.exit(1)')
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining(name))
  })
})
