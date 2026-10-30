// The unique index → 409 map (spec 0010.2, Unique index names). Value
// sourcing: the code comes from the violated index name; anything unmapped
// rethrows unchanged.
import { AppError } from '@collabo/service-kit'
import { describe, expect, it } from 'vitest'
import { toConflict, withConflicts } from './conflicts'

/** A unique violation as Drizzle throws it: the driver error under `cause`. */
const uniqueViolation = (constraint: string) =>
  Object.assign(new Error('Failed query'), { cause: { code: '23505', message: 'duplicate key', constraint } })

describe('toConflict', () => {
  it.each([
    ['ride_requests_one_open_per_rider', 'active_request_exists'],
    ['offers_one_live_per_driver', 'offer_exists'],
    ['trips_one_active_per_driver', 'driver_busy'],
    ['trip_riders_one_live_per_request', 'request_not_open'],
    ['trip_riders_one_active_per_rider', 'rider_on_trip'],
  ])('maps %s to a 409 %s', (index, code) => {
    const mapped = toConflict(uniqueViolation(index))
    expect(mapped).toBeInstanceOf(AppError)
    expect(mapped).toMatchObject({ status: 409, code })
  })

  it('gives a fresh error each time, so stacks never leak between requests', () => {
    expect(toConflict(uniqueViolation('trips_one_active_per_driver'))).not.toBe(
      toConflict(uniqueViolation('trips_one_active_per_driver')),
    )
  })

  it('returns a violation of an unmapped index unchanged', () => {
    const err = uniqueViolation('some_other_index')
    expect(toConflict(err)).toBe(err)
  })

  it('returns a non unique error unchanged', () => {
    const err = Object.assign(new Error('Failed query'), { cause: { code: '23514', constraint: 'x' } })
    expect(toConflict(err)).toBe(err)
  })
})

describe('withConflicts', () => {
  it('passes the result through when the work succeeds', async () => {
    expect(await withConflicts(() => Promise.resolve('trip-1'))).toBe('trip-1')
  })

  it('rethrows a known violation as its API error', async () => {
    await expect(
      withConflicts(() => Promise.reject(uniqueViolation('ride_requests_one_open_per_rider'))),
    ).rejects.toMatchObject({ status: 409, code: 'active_request_exists' })
  })

  it('rethrows anything else as the same error', async () => {
    const err = new Error('connection reset')
    await expect(withConflicts(() => Promise.reject(err))).rejects.toBe(err)
  })
})
