// How a Postgres error is read through Drizzle's wrapper (spec 0010, Unique
// index names). The 409 mapping in each service relies on these.
import { describe, expect, it } from 'vitest'
import { pgErrorCode, pgErrorMessage, violatedUniqueIndex } from './errors'

const pgError = (code: string, message: string, constraint?: string) => ({ code, message, constraint })
/** Drizzle throws its own error with the driver error as `cause`. */
const wrapped = (cause: unknown) => Object.assign(new Error('Failed query: INSERT ...'), { cause })

describe('violatedUniqueIndex', () => {
  it('names the index of a unique violation thrown by the driver', () => {
    expect(violatedUniqueIndex(pgError('23505', 'duplicate key', 'trips_one_active_per_driver'))).toBe(
      'trips_one_active_per_driver',
    )
  })

  it('finds the violation under the Drizzle wrapper', () => {
    expect(violatedUniqueIndex(wrapped(pgError('23505', 'duplicate key', 'offers_one_live_per_driver')))).toBe(
      'offers_one_live_per_driver',
    )
  })

  it('ignores any other Postgres error', () => {
    expect(violatedUniqueIndex(wrapped(pgError('23514', 'check violation', 'trips_status_check')))).toBeUndefined()
  })

  it('returns undefined for a unique violation with no constraint name', () => {
    expect(violatedUniqueIndex(pgError('23505', 'duplicate key'))).toBeUndefined()
  })

  it('returns undefined for values that are not errors', () => {
    expect(violatedUniqueIndex(undefined)).toBeUndefined()
    expect(violatedUniqueIndex(null)).toBeUndefined()
    expect(violatedUniqueIndex('23505')).toBeUndefined()
    expect(violatedUniqueIndex(new Error('plain'))).toBeUndefined()
  })

  it('stops walking a cause chain after five levels', () => {
    const deep = wrapped(wrapped(wrapped(wrapped(wrapped(pgError('23505', 'dup', 'too_deep'))))))
    expect(violatedUniqueIndex(deep)).toBeUndefined()
  })

  it('does not loop forever on a cause cycle', () => {
    const a: { cause?: unknown } = {}
    a.cause = a
    expect(violatedUniqueIndex(a)).toBeUndefined()
  })
})

describe('pgErrorCode', () => {
  it('returns the SQLSTATE from under the wrapper', () => {
    expect(pgErrorCode(wrapped(pgError('P0001', 'insufficient_balance')))).toBe('P0001')
  })

  it('returns the first string code it meets', () => {
    expect(pgErrorCode(Object.assign(wrapped(pgError('P0001', 'inner')), { code: 'OUTER' }))).toBe('OUTER')
  })

  it('returns undefined when no level has a code', () => {
    expect(pgErrorCode(wrapped(new Error('no code')))).toBeUndefined()
  })
})

describe('pgErrorMessage', () => {
  it('returns the Postgres message, not the wrapper message', () => {
    expect(pgErrorMessage(wrapped(pgError('P0001', 'idempotency_key_reused')))).toBe('idempotency_key_reused')
  })

  it('returns undefined when no level carries a Postgres code', () => {
    expect(pgErrorMessage(new Error('Failed query'))).toBeUndefined()
  })
})
