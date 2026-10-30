// Accepting a request at the rider's price (spec 0010.2, Concurrency rules).
// One transaction: the request moves open → matched only if it is still open
// at the price the driver saw, then the offer, the trip, and the rider row are
// written, each change with its status_history and outbox rows. The loser of a
// race gets 409 request_not_open (or offer_stale), and the partial unique
// indexes back this up if a code path ever skips the conditional update.
import { randomInt } from 'node:crypto'
import { AppError } from '@collabo/service-kit'
import { type Actor, recordStatus, transition, writeOutbox } from '@collabo/service-kit/db'
import { and, eq, inArray, ne, sql } from 'drizzle-orm'
import type { TripDb, TripTx } from './client'
import { offerStale, requestNotOpen, withConflicts } from './conflicts'
import { offerEvent, requestClosed, tripRiderUpdated, tripUpdated } from './events'
import {
  type DriverSnapshot,
  offers,
  type RideClass,
  type RiderSnapshot,
  rideRequests,
  tripRiders,
  trips,
} from './schema'

export interface AcceptInput {
  requestId: string
  /** The request's price_version the driver accepted. */
  priceVersion: number
  driverId: string
  vehicleId: string
  driverSnapshot: DriverSnapshot
  riderSnapshot: RiderSnapshot
  etaSeconds?: number | null
  /** Collabo (#20): add this rider to the driver's assigned trip as rider 2. */
  joinTripId?: string
}

export interface AcceptResult {
  tripId: string
  tripRiderId: string
  offerId: string
}

/** A random 4 digit PIN per rider row. */
export const newPin = () => randomInt(0, 10_000).toString().padStart(4, '0')

const LIVE_RIDER_STATUSES = ['scheduled', 'waiting', 'arrived', 'on_board', 'dropped_off'] as const

export function acceptRequest(db: TripDb, input: AcceptInput, actor: Actor): Promise<AcceptResult> {
  return withConflicts(() =>
    db.transaction(async (tx) => {
      const matched = await transition(tx, {
        table: 'ride_requests',
        subjectType: 'ride_request',
        id: input.requestId,
        from: ['open'],
        to: 'matched',
        where: sql`price_version = ${input.priceVersion}`,
        set: sql`matched_at = now()`,
        actor,
        events: async ({ version }) => {
          const [r] = await tx.select().from(rideRequests).where(eq(rideRequests.id, input.requestId))
          if (!r) throw new Error('matched request vanished')
          return [requestClosed(r, 'matched', version, actor.requestId)]
        },
      })
      if (!matched) throw await whyNotOpen(tx, input)

      const [request] = await tx.select().from(rideRequests).where(eq(rideRequests.id, input.requestId))
      if (!request) throw new Error('matched request vanished')

      const [offer] = await tx
        .insert(offers)
        .values({
          requestId: request.id,
          driverId: input.driverId,
          vehicleId: input.vehicleId,
          kind: 'accept',
          priceKobo: request.currentPriceKobo,
          priceVersion: request.priceVersion,
          status: 'accepted',
          expiresAt: request.expiresAt,
          etaSeconds: input.etaSeconds ?? null,
          driverSnapshot: input.driverSnapshot,
        })
        .returning()
      if (!offer) throw new Error('offer insert returned no row')
      await writeOutbox(tx, offerEvent('trip.offer.created', offer, request.riderId, actor.requestId))

      const closed = await tx
        .update(offers)
        .set({ status: 'closed', closeReason: 'rider_chose_other', version: sql`${offers.version} + 1` })
        .where(and(eq(offers.requestId, request.id), eq(offers.status, 'live'), ne(offers.id, offer.id)))
        .returning()
      for (const o of closed)
        await writeOutbox(tx, offerEvent('trip.offer.updated', o, request.riderId, actor.requestId))

      const { trip, joinOrder } = input.joinTripId
        ? await joinTrip(tx, input.joinTripId, input.driverId)
        : await startTrip(tx, input, request.rideClass, actor)

      const [rider] = await tx
        .insert(tripRiders)
        .values({
          tripId: trip.id,
          requestId: request.id,
          offerId: offer.id,
          riderId: request.riderId,
          joinOrder,
          riderSnapshot: input.riderSnapshot,
          pickupPoint: request.pickupPoint,
          dropoffPoint: request.dropoffPoint,
          pickupAddress: request.pickupAddress,
          dropoffAddress: request.dropoffAddress,
          agreedFareKobo: offer.priceKobo,
          pin: newPin(),
          status: 'waiting',
          paymentMethod: request.paymentMethod,
        })
        .returning()
      if (!rider) throw new Error('trip rider insert returned no row')
      await recordStatus(tx, {
        subjectType: 'trip_rider',
        subjectId: rider.id,
        fromStatus: null,
        toStatus: rider.status,
        actor,
      })
      await writeOutbox(tx, tripRiderUpdated(rider, trip.driverId, actor.requestId))

      const riderIds = await tx
        .select({ riderId: tripRiders.riderId })
        .from(tripRiders)
        .where(and(eq(tripRiders.tripId, trip.id), inArray(tripRiders.status, LIVE_RIDER_STATUSES)))
      await writeOutbox(
        tx,
        tripUpdated(
          trip,
          riderIds.map((r) => r.riderId),
          actor.requestId,
        ),
      )
      return { tripId: trip.id, tripRiderId: rider.id, offerId: offer.id }
    }),
  )
}

/** Zero rows from the conditional update: the request ended, or its price moved on. */
async function whyNotOpen(tx: TripTx, input: AcceptInput): Promise<AppError> {
  const [r] = await tx
    .select({ status: rideRequests.status, priceVersion: rideRequests.priceVersion })
    .from(rideRequests)
    .where(eq(rideRequests.id, input.requestId))
  if (r && r.status === 'open' && r.priceVersion !== input.priceVersion) return offerStale()
  return requestNotOpen()
}

async function startTrip(tx: TripTx, input: AcceptInput, rideClass: RideClass, actor: Actor) {
  const [trip] = await tx
    .insert(trips)
    .values({
      driverId: input.driverId,
      vehicleId: input.vehicleId,
      rideClass,
      status: 'assigned',
      driverSnapshot: input.driverSnapshot,
      assignedAt: new Date(),
    })
    .returning()
  if (!trip) throw new Error('trip insert returned no row')
  await recordStatus(tx, { subjectType: 'trip', subjectId: trip.id, fromStatus: null, toStatus: trip.status, actor })
  return { trip, joinOrder: 1 }
}

/**
 * Collabo: lock the trip, require it still `assigned` with no rider past
 * `arrived`, and add rider 2. The trip's rider list changed, so its version moves.
 */
async function joinTrip(tx: TripTx, tripId: string, driverId: string) {
  const [locked] = await tx.select().from(trips).where(eq(trips.id, tripId)).for('update')
  if (!locked || locked.driverId !== driverId || locked.status !== 'assigned') {
    throw new AppError(409, 'trip_not_joinable', 'This trip can no longer take another rider')
  }
  const onward = await tx
    .select({ id: tripRiders.id })
    .from(tripRiders)
    .where(and(eq(tripRiders.tripId, tripId), inArray(tripRiders.status, ['on_board', 'dropped_off'])))
  if (onward.length > 0) throw new AppError(409, 'trip_not_joinable', 'This trip can no longer take another rider')
  const [trip] = await tx
    .update(trips)
    .set({ version: sql`${trips.version} + 1` })
    .where(eq(trips.id, tripId))
    .returning()
  if (!trip) throw new Error('locked trip vanished')
  return { trip, joinOrder: 2 }
}
