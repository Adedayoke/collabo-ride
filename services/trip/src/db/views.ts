// The scoped repository (spec 0010.2, Fare privacy). Every user facing read of
// trip_riders goes through here and selects explicit columns:
// - a rider sees the trip and only their own rider row (with fare and PIN);
// - the trip's driver sees every rider row, never a PIN.
// Route handlers never query trip_riders themselves.
import { and, desc, eq, lt, or, sql } from 'drizzle-orm'
import type { TripExecutor } from './client'
import { tripRiders, trips } from './schema'

const tripColumns = {
  id: trips.id,
  status: trips.status,
  rideClass: trips.rideClass,
  driverId: trips.driverId,
  driverSnapshot: trips.driverSnapshot,
  scheduledFor: trips.scheduledFor,
  assignedAt: trips.assignedAt,
  startedAt: trips.startedAt,
  completedAt: trips.completedAt,
  cancelledAt: trips.cancelledAt,
  version: trips.version,
}

/** Fields of a rider row any party to the trip may see. */
const sharedRiderColumns = {
  id: tripRiders.id,
  joinOrder: tripRiders.joinOrder,
  status: tripRiders.status,
  pickupPoint: tripRiders.pickupPoint,
  dropoffPoint: tripRiders.dropoffPoint,
  pickupAddress: tripRiders.pickupAddress,
  dropoffAddress: tripRiders.dropoffAddress,
  agreedFareKobo: tripRiders.agreedFareKobo,
  paymentMethod: tripRiders.paymentMethod,
  paymentStatus: tripRiders.paymentStatus,
  pickedUpAt: tripRiders.pickedUpAt,
  droppedOffAt: tripRiders.droppedOffAt,
  cancelledAt: tripRiders.cancelledAt,
  version: tripRiders.version,
}

/** The rider's own row: the shared fields plus their PIN. */
const ownRiderColumns = { ...sharedRiderColumns, pin: tripRiders.pin }

/** What the driver sees of each rider: the shared fields plus the rider's card. */
const driverRiderColumns = { ...sharedRiderColumns, riderSnapshot: tripRiders.riderSnapshot }

const isShared = sql<boolean>`EXISTS (
  SELECT 1 FROM ${tripRiders} AS other WHERE other.trip_id = ${trips.id} AND other.id <> ${tripRiders.id}
)`.as('is_shared')

/** The trip as one rider sees it: the trip, their own row, and whether it is shared. Null if not theirs. */
export async function riderTripView(db: TripExecutor, riderId: string, tripId: string) {
  const rows = await db
    .select({ trip: tripColumns, me: ownRiderColumns, isShared })
    .from(tripRiders)
    .innerJoin(trips, eq(trips.id, tripRiders.tripId))
    .where(and(eq(tripRiders.tripId, tripId), eq(tripRiders.riderId, riderId)))
    .orderBy(desc(tripRiders.createdAt))
    .limit(1)
  return rows[0] ?? null
}

export type RiderTripView = NonNullable<Awaited<ReturnType<typeof riderTripView>>>

export const HISTORY_PAGE_SIZE = 20

/** The rider's own rides, newest first, 20 per page. Pass the last row's id to get the next page. */
export async function riderTripHistory(db: TripExecutor, riderId: string, cursor?: string) {
  const after = cursor
    ? await db
        .select({ createdAt: tripRiders.createdAt, id: tripRiders.id })
        .from(tripRiders)
        .where(and(eq(tripRiders.id, cursor), eq(tripRiders.riderId, riderId)))
    : []
  const from = after[0]
  const rows = await db
    .select({ trip: tripColumns, me: sharedRiderColumns })
    .from(tripRiders)
    .innerJoin(trips, eq(trips.id, tripRiders.tripId))
    .where(
      and(
        eq(tripRiders.riderId, riderId),
        from
          ? or(
              lt(tripRiders.createdAt, from.createdAt),
              and(eq(tripRiders.createdAt, from.createdAt), lt(tripRiders.id, from.id)),
            )
          : undefined,
      ),
    )
    .orderBy(desc(tripRiders.createdAt), desc(tripRiders.id))
    .limit(HISTORY_PAGE_SIZE + 1)
  const page = rows.slice(0, HISTORY_PAGE_SIZE)
  const nextCursor = rows.length > HISTORY_PAGE_SIZE ? (page.at(-1)?.me.id ?? null) : null
  return { rides: page, nextCursor }
}

/** The trip as its driver sees it: every rider row, without PINs. Null if not their trip. */
export async function driverTripView(db: TripExecutor, driverId: string, tripId: string) {
  const found = await db
    .select(tripColumns)
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.driverId, driverId)))
  const trip = found[0]
  if (!trip) return null
  const riders = await db
    .select(driverRiderColumns)
    .from(tripRiders)
    .where(eq(tripRiders.tripId, tripId))
    .orderBy(tripRiders.joinOrder, tripRiders.createdAt)
  return { trip, riders }
}

export type DriverTripView = NonNullable<Awaited<ReturnType<typeof driverTripView>>>
