// The trip schema's core tables (spec 0010.2). Later tables arrive with the
// features that first need them (spec 0010, Arrival map). Only src/db/ may
// import trip_riders: every rider facing read goes through views.ts.
import { geographyPoint } from '@collabo/service-kit'
import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgSchema,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

/** Every trip table lives in the service's own schema (spec 0009). */
export const tripSchema = pgSchema('trip')

export const RIDE_CLASSES = ['economy', 'comfort', 'luxury'] as const
export const PAYMENT_METHODS = ['cash', 'card', 'wallet'] as const
export const REQUEST_STATUSES = ['open', 'matched', 'expired', 'cancelled'] as const
export const OFFER_KINDS = ['accept', 'counter'] as const
export const OFFER_STATUSES = ['live', 'accepted', 'superseded', 'closed', 'expired', 'withdrawn'] as const
export const OFFER_CLOSE_REASONS = ['rider_chose_other', 'request_ended', 'price_changed'] as const
export const TRIP_STATUSES = ['scheduled', 'assigned', 'in_progress', 'completed', 'cancelled'] as const
export const RIDER_STATUSES = [
  'scheduled',
  'waiting',
  'arrived',
  'on_board',
  'dropped_off',
  'cancelled',
  'no_show',
] as const
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'cash'] as const
export const ACTOR_ROLES = ['rider', 'driver', 'staff', 'system'] as const

export type RideClass = (typeof RIDE_CLASSES)[number]
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export type RequestStatus = (typeof REQUEST_STATUSES)[number]
export type OfferStatus = (typeof OFFER_STATUSES)[number]
export type TripStatus = (typeof TRIP_STATUSES)[number]
export type RiderStatus = (typeof RIDER_STATUSES)[number]
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

/** `col IN ('a', 'b')` for a CHECK, from one of the lists above. */
const oneOf = (column: string, values: readonly string[]) =>
  sql.raw(`${column} IN (${values.map((v) => `'${v}'`).join(', ')})`)

const id = () =>
  uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`)
const money = (name: string) => bigint(name, { mode: 'bigint' })
const at = (name: string) => timestamp(name, { withTimezone: true })
const audit = {
  version: bigint('version', { mode: 'number' }).notNull().default(1),
  createdAt: at('created_at').notNull().defaultNow(),
  updatedAt: at('updated_at').notNull().defaultNow(),
}

/** A driver's display card, copied at offer time so history never changes. */
export interface DriverSnapshot {
  firstName: string
  lastInitial: string
  photoKey: string | null
  rating: number | null
  vehicle: { make: string; model: string; colour: string; plate: string }
}

/** A rider's display card, for the driver. */
export interface RiderSnapshot {
  firstName: string
  lastInitial: string
  photoKey: string | null
  rating: number | null
}

export const rideRequests = tripSchema.table(
  'ride_requests',
  {
    id: id(),
    riderId: uuid('rider_id').notNull(),
    rideClass: text('ride_class').$type<RideClass>().notNull(),
    pickupPoint: geographyPoint('pickup_point').notNull(),
    dropoffPoint: geographyPoint('dropoff_point').notNull(),
    pickupAddress: text('pickup_address').notNull(),
    dropoffAddress: text('dropoff_address').notNull(),
    pickupPlaceId: text('pickup_place_id'),
    dropoffPlaceId: text('dropoff_place_id'),
    estDistanceM: integer('est_distance_m'),
    estDurationS: integer('est_duration_s'),
    suggestedMinKobo: money('suggested_min_kobo'),
    currentPriceKobo: money('current_price_kobo').notNull(),
    priceVersion: integer('price_version').notNull().default(1),
    isCollaboOptIn: boolean('is_collabo_opt_in').notNull().default(false),
    paymentMethod: text('payment_method').$type<PaymentMethod>().notNull(),
    paymentMethodId: uuid('payment_method_id'),
    promoCode: text('promo_code'),
    scheduledFor: at('scheduled_for'),
    releaseAt: at('release_at'),
    status: text('status').$type<RequestStatus>().notNull().default('open'),
    expiresAt: at('expires_at').notNull(),
    matchedAt: at('matched_at'),
    cancelledAt: at('cancelled_at'),
    cancelReason: text('cancel_reason'),
    ...audit,
  },
  (t) => [
    check('ride_requests_ride_class_check', oneOf('ride_class', RIDE_CLASSES)),
    check('ride_requests_payment_method_check', oneOf('payment_method', PAYMENT_METHODS)),
    check('ride_requests_status_check', oneOf('status', REQUEST_STATUSES)),
    check('ride_requests_current_price_kobo_check', sql`current_price_kobo > 0`),
    check('ride_requests_suggested_min_kobo_check', sql`suggested_min_kobo >= 0`),
    check('ride_requests_price_version_check', sql`price_version >= 1`),
    check('ride_requests_card_has_method_check', sql`payment_method <> 'card' OR payment_method_id IS NOT NULL`),
    uniqueIndex('ride_requests_one_open_per_rider')
      .on(t.riderId)
      .where(sql`status = 'open' AND scheduled_for IS NULL`),
    index('ride_requests_rider_created_idx').on(t.riderId, t.createdAt.desc()),
  ],
)

export const offers = tripSchema.table(
  'offers',
  {
    id: id(),
    requestId: uuid('request_id')
      .notNull()
      .references(() => rideRequests.id, { onDelete: 'restrict' }),
    driverId: uuid('driver_id').notNull(),
    vehicleId: uuid('vehicle_id').notNull(),
    kind: text('kind').$type<(typeof OFFER_KINDS)[number]>().notNull(),
    priceKobo: money('price_kobo').notNull(),
    priceVersion: integer('price_version').notNull(),
    status: text('status').$type<OfferStatus>().notNull().default('live'),
    closeReason: text('close_reason').$type<(typeof OFFER_CLOSE_REASONS)[number]>(),
    expiresAt: at('expires_at').notNull(),
    etaSeconds: integer('eta_seconds'),
    driverSnapshot: jsonb('driver_snapshot').$type<DriverSnapshot>().notNull(),
    ...audit,
  },
  (t) => [
    check('offers_kind_check', oneOf('kind', OFFER_KINDS)),
    check('offers_status_check', oneOf('status', OFFER_STATUSES)),
    check('offers_close_reason_check', sql`close_reason IS NULL OR ${oneOf('close_reason', OFFER_CLOSE_REASONS)}`),
    check('offers_price_kobo_check', sql`price_kobo > 0`),
    uniqueIndex('offers_one_live_per_driver')
      .on(t.requestId, t.driverId)
      .where(sql`status = 'live'`),
    index('offers_request_status_idx').on(t.requestId, t.status),
  ],
)

export const trips = tripSchema.table(
  'trips',
  {
    id: id(),
    driverId: uuid('driver_id').notNull(),
    vehicleId: uuid('vehicle_id').notNull(),
    rideClass: text('ride_class').$type<RideClass>().notNull(),
    status: text('status').$type<TripStatus>().notNull(),
    driverSnapshot: jsonb('driver_snapshot').$type<DriverSnapshot>().notNull(),
    scheduledFor: at('scheduled_for'),
    assignedAt: at('assigned_at'),
    startedAt: at('started_at'),
    completedAt: at('completed_at'),
    cancelledAt: at('cancelled_at'),
    cancelReason: text('cancel_reason'),
    routeDistanceM: integer('route_distance_m'),
    routeDurationS: integer('route_duration_s'),
    lastDriverLocationAt: at('last_driver_location_at'),
    ...audit,
  },
  (t) => [
    check('trips_ride_class_check', oneOf('ride_class', RIDE_CLASSES)),
    check('trips_status_check', oneOf('status', TRIP_STATUSES)),
    uniqueIndex('trips_one_active_per_driver')
      .on(t.driverId)
      .where(sql`status IN ('assigned', 'in_progress')`),
    index('trips_driver_created_idx').on(t.driverId, t.createdAt.desc()),
  ],
)

export const tripRiders = tripSchema.table(
  'trip_riders',
  {
    id: id(),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'restrict' }),
    requestId: uuid('request_id')
      .notNull()
      .references(() => rideRequests.id, { onDelete: 'restrict' }),
    offerId: uuid('offer_id')
      .notNull()
      .references(() => offers.id, { onDelete: 'restrict' }),
    riderId: uuid('rider_id').notNull(),
    joinOrder: smallint('join_order').notNull(),
    riderSnapshot: jsonb('rider_snapshot').$type<RiderSnapshot>().notNull(),
    pickupPoint: geographyPoint('pickup_point').notNull(),
    dropoffPoint: geographyPoint('dropoff_point').notNull(),
    pickupAddress: text('pickup_address').notNull(),
    dropoffAddress: text('dropoff_address').notNull(),
    agreedFareKobo: money('agreed_fare_kobo').notNull(),
    pin: text('pin').notNull(),
    pinAttempts: smallint('pin_attempts').notNull().default(0),
    status: text('status').$type<RiderStatus>().notNull(),
    paymentMethod: text('payment_method').$type<PaymentMethod>().notNull(),
    paymentStatus: text('payment_status').$type<PaymentStatus>().notNull().default('pending'),
    distanceM: integer('distance_m'),
    detourSeconds: integer('detour_seconds'),
    pickedUpAt: at('picked_up_at'),
    droppedOffAt: at('dropped_off_at'),
    cancelledAt: at('cancelled_at'),
    cancelReason: text('cancel_reason'),
    cancelledByRole: text('cancelled_by_role').$type<(typeof ACTOR_ROLES)[number]>(),
    ...audit,
  },
  (t) => [
    check('trip_riders_join_order_check', sql`join_order BETWEEN 1 AND 2`),
    check('trip_riders_agreed_fare_kobo_check', sql`agreed_fare_kobo > 0`),
    check('trip_riders_pin_check', sql`pin ~ '^[0-9]{4}$'`),
    check('trip_riders_pin_attempts_check', sql`pin_attempts BETWEEN 0 AND 5`),
    check('trip_riders_status_check', oneOf('status', RIDER_STATUSES)),
    check('trip_riders_payment_method_check', oneOf('payment_method', PAYMENT_METHODS)),
    check('trip_riders_payment_status_check', oneOf('payment_status', PAYMENT_STATUSES)),
    check(
      'trip_riders_cancelled_by_role_check',
      sql`cancelled_by_role IS NULL OR ${oneOf('cancelled_by_role', ACTOR_ROLES)}`,
    ),
    uniqueIndex('trip_riders_trip_id_join_order_key').on(t.tripId, t.joinOrder),
    uniqueIndex('trip_riders_one_live_per_request')
      .on(t.requestId)
      .where(sql`status NOT IN ('cancelled', 'no_show')`),
    uniqueIndex('trip_riders_one_active_per_rider')
      .on(t.riderId)
      .where(sql`status IN ('waiting', 'arrived', 'on_board')`),
    index('trip_riders_rider_created_idx').on(t.riderId, t.createdAt.desc()),
    index('trip_riders_trip_idx').on(t.tripId),
    index('trip_riders_request_idx').on(t.requestId),
    index('trip_riders_offer_idx').on(t.offerId),
    index('trip_riders_unpaid_idx')
      .on(t.riderId)
      .where(sql`payment_status = 'failed'`),
  ],
)
