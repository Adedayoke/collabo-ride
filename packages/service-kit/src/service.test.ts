import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { contextHeaders } from './context'
import { createService } from './service'

const env = {
  NODE_ENV: 'test' as const,
  SERVICE_NAME: 'kit-test',
  PORT: 0,
  LOG_LEVEL: 'error' as const,
  GATEWAY_CONTEXT_KEY: 'test-gateway-context-key-0123456789abcdef',
}

const app = createService({
  env,
  routes: (a) => a.get('/whoami', (req, res) => void res.json({ userId: req.ctx?.userId, requestId: req.requestId })),
})
let base = ''
const server = app.listen(0)

beforeAll(() => {
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => void server.close())

describe('createService', () => {
  it('serves /health without context and returns a request id', async () => {
    const res = await fetch(`${base}/health`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok', service: 'kit-test' })
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })

  it('rejects routes without a signed context, using the error shape', async () => {
    const res = await fetch(`${base}/whoami`)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ code: 'BAD_CONTEXT', message: 'missing context headers' })
  })

  it('accepts a valid signed context and keeps the request id', async () => {
    const headers = contextHeaders(
      { userId: 'usr_1', role: 'rider', phoneVerified: true, requestId: 'req-abc', timestamp: Math.floor(Date.now() / 1000) },
      env.GATEWAY_CONTEXT_KEY,
    )
    const res = await fetch(`${base}/whoami`, { headers })
    expect(await res.json()).toEqual({ userId: 'usr_1', requestId: 'req-abc' })
  })

  it('returns NOT_FOUND in the error shape', async () => {
    const headers = contextHeaders(
      { userId: 'usr_1', role: 'rider', phoneVerified: true, requestId: 'r', timestamp: Math.floor(Date.now() / 1000) },
      env.GATEWAY_CONTEXT_KEY,
    )
    const res = await fetch(`${base}/nope`, { headers })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ code: 'NOT_FOUND', message: 'Route not found' })
  })

  const now = () => Math.floor(Date.now() / 1000)
  const signed = (requestId = 'req-1') =>
    contextHeaders({ userId: 'usr_1', role: 'rider', phoneVerified: true, requestId, timestamp: now() }, env.GATEWAY_CONTEXT_KEY)

  it('echoes the caller request id on /health', async () => {
    const res = await fetch(`${base}/health`, { headers: { 'x-request-id': 'trace-me-123' } })
    expect(res.headers.get('x-request-id')).toBe('trace-me-123')
  })

  it('replaces a request id longer than 128 characters', async () => {
    const res = await fetch(`${base}/health`, { headers: { 'x-request-id': 'x'.repeat(129) } })
    const id = res.headers.get('x-request-id')
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('gives each request a different generated id', async () => {
    const [a, b] = await Promise.all([fetch(`${base}/health`), fetch(`${base}/health`)])
    expect(a.headers.get('x-request-id')).not.toBe(b.headers.get('x-request-id'))
  })

  it('returns a request id on a 401 too, so rejected calls stay traceable', async () => {
    const res = await fetch(`${base}/whoami`, { headers: { 'x-request-id': 'rejected-1' } })
    expect(res.status).toBe(401)
    expect(res.headers.get('x-request-id')).toBe('rejected-1')
  })

  it('rejects a context signed with another key', async () => {
    const headers = contextHeaders(
      { userId: 'usr_1', role: 'rider', phoneVerified: true, requestId: 'r', timestamp: now() },
      'another-key-that-is-long-enough-000000',
    )
    const res = await fetch(`${base}/whoami`, { headers })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ code: 'BAD_CONTEXT', message: 'bad signature' })
  })

  it('rejects a context whose role was changed after signing', async () => {
    const res = await fetch(`${base}/whoami`, { headers: { ...signed(), 'x-user-role': 'staff' } })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ code: 'BAD_CONTEXT', message: 'bad signature' })
  })

  it('rejects a context older than 30 seconds', async () => {
    const headers = contextHeaders(
      { userId: 'usr_1', role: 'rider', phoneVerified: true, requestId: 'r', timestamp: now() - 120 },
      env.GATEWAY_CONTEXT_KEY,
    )
    const res = await fetch(`${base}/whoami`, { headers })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ code: 'BAD_CONTEXT', message: 'stale timestamp' })
  })

  it('does not reveal the framework in an x-powered-by header', async () => {
    const res = await fetch(`${base}/health`)
    expect(res.headers.get('x-powered-by')).toBeNull()
  })
})

describe('createService with signedContext: false (the gateway)', () => {
  const gateway = createService({
    env: { ...env, SERVICE_NAME: 'gateway' },
    signedContext: false,
    routes: (a) => a.get('/open', (req, res) => void res.json({ ctx: req.ctx ?? null, requestId: req.requestId })),
  })
  const gatewayServer = gateway.listen(0)
  let gatewayBase = ''

  beforeAll(() => {
    gatewayBase = `http://127.0.0.1:${(gatewayServer.address() as AddressInfo).port}`
  })
  afterAll(() => void gatewayServer.close())

  it('serves routes without any context headers', async () => {
    const res = await fetch(`${gatewayBase}/open`, { headers: { 'x-request-id': 'gw-1' } })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ctx: null, requestId: 'gw-1' })
  })

  it('still answers unknown routes with NOT_FOUND', async () => {
    const res = await fetch(`${gatewayBase}/v1/x`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ code: 'NOT_FOUND', message: 'Route not found' })
  })

  it('reports its own name on /health', async () => {
    expect(await (await fetch(`${gatewayBase}/health`)).json()).toEqual({ status: 'ok', service: 'gateway' })
  })
})
