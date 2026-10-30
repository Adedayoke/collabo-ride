// Outbox rows for trip changes (spec 0011, trip catalog). `data` is the full
// public state after the change; no event ever carries a PIN.
import type { OutboxEvent } from '@collabo/service-kit/db'
import type { offers, rideRequests, tripRiders, trips } from './schema'

type Request = typeof rideRequests.$inferSelect
type Offer = typeof offers.$inferSelect
type Trip = typeof trips.$inferSelect
type TripRider = typeof tripRiders.$inferSelect

const STREAM = 'trip'
const kobo = (v: bigint | null) => (v === null ? null : v.toString())

function event(
  type: string,
  subjectType: string,
  row: { id: string; version: number },
  requestId: string,
  data: Record<string, unknown>,
): OutboxEvent {
  return { stream: STREAM, type, subjectType, subjectSeq: row.version, requestId, payload: { id: row.id, ...data } }
}

export function requestOpened(r: Request, requestId: string): OutboxEvent {
  return event('trip.ride_request.opened', 'ride_request', r, requestId, {
    rider_id: r.riderId,
    ride_class: r.rideClass,
    pickup: { point: r.pickupPoint, address: r.pickupAddress },
    dropoff: { point: r.dropoffPoint, address: r.dropoffAddress },
    est_distance_m: r.estDistanceM,
    est_duration_s: r.estDurationS,
    current_price_kobo: kobo(r.currentPriceKobo),
    price_version: r.priceVersion,
    is_collabo_opt_in: r.isCollaboOptIn,
    payment_method: r.paymentMethod,
    scheduled_for: r.scheduledFor,
    release_at: r.releaseAt,
    expires_at: r.expiresAt,
    created_at: r.createdAt,
  })
}

export function requestClosed(
  r: Pick<Request, 'id' | 'riderId' | 'cancelReason'>,
  status: Request['status'],
  version: number,
  requestId: string,
): OutboxEvent {
  return event('trip.ride_request.closed', 'ride_request', { id: r.id, version }, requestId, {
    rider_id: r.riderId,
    status,
    cancel_reason: r.cancelReason,
  })
}

export function offerEvent(
  type: 'trip.offer.created' | 'trip.offer.updated',
  o: Offer,
  riderId: string,
  requestId: string,
): OutboxEvent {
  return event(type, 'offer', o, requestId, {
    request_id: o.requestId,
    rider_id: riderId,
    driver_id: o.driverId,
    driver_card: o.driverSnapshot,
    kind: o.kind,
    price_kobo: kobo(o.priceKobo),
    price_version: o.priceVersion,
    eta_seconds: o.etaSeconds,
    expires_at: o.expiresAt,
    status: o.status,
    close_reason: o.closeReason,
  })
}

export function tripUpdated(t: Trip, riderIds: readonly string[], requestId: string): OutboxEvent {
  return event('trip.trip.updated', 'trip', t, requestId, {
    driver_id: t.driverId,
    driver_card: t.driverSnapshot,
    ride_class: t.rideClass,
    status: t.status,
    rider_ids: riderIds,
    scheduled_for: t.scheduledFor,
    assigned_at: t.assignedAt,
    started_at: t.startedAt,
    completed_at: t.completedAt,
    cancelled_at: t.cancelledAt,
  })
}

export function tripRiderUpdated(r: TripRider, driverId: string, requestId: string): OutboxEvent {
  return event('trip.trip_rider.updated', 'trip_rider', r, requestId, {
    trip_id: r.tripId,
    rider_id: r.riderId,
    driver_id: driverId,
    join_order: r.joinOrder,
    rider_card: r.riderSnapshot,
    pickup: { point: r.pickupPoint, address: r.pickupAddress },
    dropoff: { point: r.dropoffPoint, address: r.dropoffAddress },
    agreed_fare_kobo: kobo(r.agreedFareKobo),
    payment_method: r.paymentMethod,
    payment_status: r.paymentStatus,
    status: r.status,
    picked_up_at: r.pickedUpAt,
    dropped_off_at: r.droppedOffAt,
    cancelled_at: r.cancelledAt,
  })
}
