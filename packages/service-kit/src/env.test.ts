import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest'
import { z } from 'zod'
import { baseEnv, loadEnv } from './env'

const valid = {
  SERVICE_NAME: 'trip',
  PORT: '8082',
  GATEWAY_CONTEXT_KEY: 'test-gateway-context-key-0123456789abcdef',
}

class Exit extends Error {
  constructor(readonly code: number | string | null | undefined) {
    super(`process.exit(${code})`)
  }
}

let exit: MockInstance<typeof process.exit>
let stderr: MockInstance<typeof console.error>

beforeEach(() => {
  exit = vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Exit(code)
  })
  stderr = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

/** Run loadEnv and return the error output it printed before exiting. */
function failingLoad(source: NodeJS.ProcessEnv, schema: z.ZodType = baseEnv): string {
  expect(() => loadEnv(schema, source)).toThrow(Exit)
  expect(exit).toHaveBeenCalledWith(1)
  return stderr.mock.calls.map((args) => args.join(' ')).join('\n')
}

describe('loadEnv with baseEnv', () => {
  it('parses a valid environment and fills the defaults', () => {
    expect(loadEnv(baseEnv, valid)).toEqual({
      NODE_ENV: 'development',
      SERVICE_NAME: 'trip',
      PORT: 8082,
      LOG_LEVEL: 'info',
      GATEWAY_CONTEXT_KEY: valid.GATEWAY_CONTEXT_KEY,
    })
    expect(exit).not.toHaveBeenCalled()
  })

  it('keeps explicit NODE_ENV and LOG_LEVEL values', () => {
    const env = loadEnv(baseEnv, { ...valid, NODE_ENV: 'production', LOG_LEVEL: 'warn' })
    expect(env.NODE_ENV).toBe('production')
    expect(env.LOG_LEVEL).toBe('warn')
  })

  it('ignores unrelated variables', () => {
    expect(loadEnv(baseEnv, { ...valid, PATH: '/usr/bin' })).not.toHaveProperty('PATH')
  })

  it('exits with code 1 and names GATEWAY_CONTEXT_KEY when it is missing', () => {
    const { GATEWAY_CONTEXT_KEY: _, ...rest } = valid
    expect(failingLoad(rest)).toMatch(/GATEWAY_CONTEXT_KEY/)
  })

  it('rejects a context key shorter than 32 characters', () => {
    const out = failingLoad({ ...valid, GATEWAY_CONTEXT_KEY: 'x'.repeat(31) })
    expect(out).toMatch(/GATEWAY_CONTEXT_KEY: must be at least 32 characters/)
  })

  it('accepts a context key of exactly 32 characters', () => {
    expect(loadEnv(baseEnv, { ...valid, GATEWAY_CONTEXT_KEY: 'x'.repeat(32) }).GATEWAY_CONTEXT_KEY).toHaveLength(32)
  })

  it.each(['0', '-1', 'abc', '80.5'])('rejects PORT=%s', (port) => {
    expect(failingLoad({ ...valid, PORT: port })).toMatch(/PORT/)
  })

  it('rejects an unknown NODE_ENV', () => {
    expect(failingLoad({ ...valid, NODE_ENV: 'staging' })).toMatch(/NODE_ENV/)
  })

  it('lists every problem at once, not just the first', () => {
    const out = failingLoad({ LOG_LEVEL: 'verbose' })
    for (const name of ['SERVICE_NAME', 'PORT', 'LOG_LEVEL', 'GATEWAY_CONTEXT_KEY']) {
      expect(out).toContain(name)
    }
  })

  it('never prints the secret value it rejected', () => {
    const out = failingLoad({ ...valid, GATEWAY_CONTEXT_KEY: 'short-secret-value' })
    expect(out).not.toContain('short-secret-value')
  })
})

describe('loadEnv with an extended schema', () => {
  const schema = baseEnv.extend({ DATABASE_URL: z.url() })

  it('requires the service specific variables', () => {
    expect(failingLoad(valid, schema)).toMatch(/DATABASE_URL/)
  })

  it('rejects a value that is not a URL', () => {
    expect(failingLoad({ ...valid, DATABASE_URL: 'not a url' }, schema)).toMatch(/DATABASE_URL/)
  })

  it('returns the extra variables alongside the base ones', () => {
    const env = loadEnv(schema, { ...valid, DATABASE_URL: 'postgres://trip:pw@localhost:5432/collabo' })
    expect(env.DATABASE_URL).toBe('postgres://trip:pw@localhost:5432/collabo')
    expect(env.PORT).toBe(8082)
  })
})
