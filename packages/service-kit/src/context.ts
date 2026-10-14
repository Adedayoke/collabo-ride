import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Signed request context (spec 0009, Identity and trust). The gateway signs it;
 * every other service checks it. Go and Python implement the same scheme and
 * test against packages/contracts/test-vectors/context-signature.json.
 */

export const CONTEXT_HEADERS = {
  userId: 'x-user-id',
  role: 'x-user-role',
  phoneVerified: 'x-phone-verified',
  requestId: 'x-request-id',
  timestamp: 'x-ctx-ts',
  signature: 'x-ctx-sig',
} as const

export const ROLES = ['rider', 'driver', 'staff', 'system'] as const
export type Role = (typeof ROLES)[number]

/** How far a context timestamp may drift from now, in seconds. */
export const MAX_CONTEXT_SKEW_SECONDS = 30

export interface RequestContext {
  userId: string
  role: Role
  phoneVerified: boolean
  requestId: string
  /** Unix seconds. */
  timestamp: number
}

export function contextPayload(ctx: RequestContext): string {
  return [ctx.userId, ctx.role, ctx.phoneVerified ? 'true' : 'false', ctx.requestId, String(ctx.timestamp)].join('|')
}

/** Hex HMAC SHA256 of `uid|role|phoneVerified|reqId|ts`. */
export function signContext(ctx: RequestContext, key: string): string {
  return createHmac('sha256', key).update(contextPayload(ctx)).digest('hex')
}

export function contextHeaders(ctx: RequestContext, key: string): Record<string, string> {
  return {
    [CONTEXT_HEADERS.userId]: ctx.userId,
    [CONTEXT_HEADERS.role]: ctx.role,
    [CONTEXT_HEADERS.phoneVerified]: ctx.phoneVerified ? 'true' : 'false',
    [CONTEXT_HEADERS.requestId]: ctx.requestId,
    [CONTEXT_HEADERS.timestamp]: String(ctx.timestamp),
    [CONTEXT_HEADERS.signature]: signContext(ctx, key),
  }
}

export type ContextCheck = { ok: true; context: RequestContext } | { ok: false; reason: string }

/** Check signed context headers. `now` is unix seconds. */
export function verifyContext(
  headers: Record<string, string | string[] | undefined>,
  key: string,
  now: number = Math.floor(Date.now() / 1000),
): ContextCheck {
  const read = (name: string) => {
    const value = headers[name]
    return Array.isArray(value) ? value[0] : value
  }
  const userId = read(CONTEXT_HEADERS.userId)
  const role = read(CONTEXT_HEADERS.role)
  const phoneVerified = read(CONTEXT_HEADERS.phoneVerified)
  const requestId = read(CONTEXT_HEADERS.requestId)
  const ts = read(CONTEXT_HEADERS.timestamp)
  const signature = read(CONTEXT_HEADERS.signature)

  if (!userId || !role || !phoneVerified || !requestId || !ts || !signature) {
    return { ok: false, reason: 'missing context headers' }
  }
  if (!(ROLES as readonly string[]).includes(role)) return { ok: false, reason: 'unknown role' }
  if (phoneVerified !== 'true' && phoneVerified !== 'false') return { ok: false, reason: 'bad phone verified flag' }
  if (!/^\d+$/.test(ts)) return { ok: false, reason: 'bad timestamp' }

  const context: RequestContext = {
    userId,
    role: role as Role,
    phoneVerified: phoneVerified === 'true',
    requestId,
    timestamp: Number(ts),
  }
  if (Math.abs(now - context.timestamp) > MAX_CONTEXT_SKEW_SECONDS) {
    return { ok: false, reason: 'stale timestamp' }
  }

  // Buffer.from(_, 'hex') silently drops anything after the first non hex
  // character, so check the shape first (Go and Python reject these too).
  if (!/^[0-9a-f]{64}$/i.test(signature)) return { ok: false, reason: 'bad signature' }
  const expected = Buffer.from(signContext(context, key), 'hex')
  const given = Buffer.from(signature, 'hex')
  if (!timingSafeEqual(given, expected)) {
    return { ok: false, reason: 'bad signature' }
  }
  return { ok: true, context }
}
