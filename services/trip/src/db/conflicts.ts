import { AppError, violatedUniqueIndex } from '@collabo/service-kit'

/**
 * Exclusivity is enforced by partial unique indexes (spec 0010.2, Unique index
 * names). A violation maps to the same 409 the conditional update would give.
 */
const UNIQUE_CONFLICTS: Record<string, () => AppError> = {
  ride_requests_one_open_per_rider: () =>
    new AppError(409, 'active_request_exists', 'You already have an open ride request'),
  offers_one_live_per_driver: () => new AppError(409, 'offer_exists', 'You already have a live offer on this request'),
  trips_one_active_per_driver: () => new AppError(409, 'driver_busy', 'The driver is already on a trip'),
  trip_riders_one_live_per_request: () => requestNotOpen(),
  trip_riders_one_active_per_rider: () => new AppError(409, 'rider_on_trip', 'The rider is already on a trip'),
}

export const requestNotOpen = () => new AppError(409, 'request_not_open', 'This request is no longer open')
export const offerStale = () => new AppError(409, 'offer_stale', 'The rider changed the price')

/** Rethrows a known unique violation as its API error, anything else unchanged. */
export function toConflict(err: unknown): unknown {
  const index = violatedUniqueIndex(err)
  const conflict = index === undefined ? undefined : UNIQUE_CONFLICTS[index]
  return conflict ? conflict() : err
}

export async function withConflicts<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work()
  } catch (err) {
    throw toConflict(err)
  }
}
