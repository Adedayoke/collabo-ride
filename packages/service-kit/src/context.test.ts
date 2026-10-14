import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contextHeaders, type RequestContext, type Role, signContext, verifyContext } from './context'

interface Vector {
  name?: string
  uid: string
  role: Role
  phoneVerified: boolean
  reqId: string
  ts: number
  sig: string
  key?: string
}

const vectors = JSON.parse(
  readFileSync(new URL('../../contracts/test-vectors/context-signature.json', import.meta.url), 'utf8'),
) as { key: string; valid: Vector[]; invalid: Vector[] }

const toContext = (v: Vector): RequestContext => ({
  userId: v.uid,
  role: v.role,
  phoneVerified: v.phoneVerified,
  requestId: v.reqId,
  timestamp: v.ts,
})

const toHeaders = (v: Vector) => ({
  'x-user-id': v.uid,
  'x-user-role': v.role,
  'x-phone-verified': String(v.phoneVerified),
  'x-request-id': v.reqId,
  'x-ctx-ts': String(v.ts),
  'x-ctx-sig': v.sig,
})

describe('signed context', () => {
  it.each(vectors.valid)('reproduces the shared vector for $uid', (v) => {
    expect(signContext(toContext(v), vectors.key)).toBe(v.sig)
    expect(verifyContext(toHeaders(v), vectors.key, v.ts)).toEqual({ ok: true, context: toContext(v) })
  })

  it.each(vectors.invalid)('rejects: $name', (v) => {
    expect(verifyContext(toHeaders(v), v.key ?? vectors.key, v.ts).ok).toBe(false)
  })

  it('allows 30 seconds of skew and no more', () => {
    const v = vectors.valid[0]!
    expect(verifyContext(toHeaders(v), vectors.key, v.ts - 30).ok).toBe(true)
    expect(verifyContext(toHeaders(v), vectors.key, v.ts + 31)).toEqual({ ok: false, reason: 'stale timestamp' })
  })

  it('round trips through contextHeaders', () => {
    const ctx = toContext(vectors.valid[1]!)
    expect(verifyContext(contextHeaders(ctx, vectors.key), vectors.key, ctx.timestamp).ok).toBe(true)
  })
})

describe('verifyContext rejects malformed headers', () => {
  const v = vectors.valid[0]!
  const reject = (headers: Record<string, string | string[] | undefined>) =>
    verifyContext(headers, vectors.key, v.ts)

  it.each(['x-user-id', 'x-user-role', 'x-phone-verified', 'x-request-id', 'x-ctx-ts', 'x-ctx-sig'])(
    'reports missing context headers when %s is absent',
    (name) => {
      expect(reject({ ...toHeaders(v), [name]: undefined })).toEqual({ ok: false, reason: 'missing context headers' })
    },
  )

  it('treats an empty header value as missing', () => {
    expect(reject({ ...toHeaders(v), 'x-user-id': '' })).toEqual({ ok: false, reason: 'missing context headers' })
  })

  it('rejects a role outside rider, driver, staff, system', () => {
    expect(reject({ ...toHeaders(v), 'x-user-role': 'admin' })).toEqual({ ok: false, reason: 'unknown role' })
  })

  it.each(['TRUE', '1', 'yes'])('rejects the phone verified flag %s', (flag) => {
    expect(reject({ ...toHeaders(v), 'x-phone-verified': flag })).toEqual({ ok: false, reason: 'bad phone verified flag' })
  })

  it.each(['-1760400000', '1760400000.5', '1e9', ' 1760400000'])('rejects the timestamp %j', (ts) => {
    expect(reject({ ...toHeaders(v), 'x-ctx-ts': ts })).toEqual({ ok: false, reason: 'bad timestamp' })
  })

  it('reads the first value when a header repeats', () => {
    const headers = { ...toHeaders(v), 'x-user-id': [v.uid, 'usr_attacker'] }
    expect(reject(headers)).toEqual({ ok: true, context: toContext(v) })
  })

  it('accepts an upper case hex signature, like Go and Python do', () => {
    expect(reject({ ...toHeaders(v), 'x-ctx-sig': v.sig.toUpperCase() }).ok).toBe(true)
  })

  // Go (hex.DecodeString) and Python (strict hex regex) reject these, so TS must too.
  it.each([
    ['trailing non hex characters', `${v.sig}zz`],
    ['an extra odd nibble', `${v.sig}0`],
    ['a non hex signature', 'z'.repeat(64)],
  ])('rejects a signature with %s', (_label, sig) => {
    expect(reject({ ...toHeaders(v), 'x-ctx-sig': sig })).toEqual({ ok: false, reason: 'bad signature' })
  })
})
