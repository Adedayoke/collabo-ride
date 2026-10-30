import { type Actor, type Point, recordStatus, writeOutbox } from '@collabo/service-kit'
import type { TripDb } from './client'
import { withConflicts } from './conflicts'
import { requestOpened } from './events'
import { type PaymentMethod, type RideClass, rideRequests } from './schema'

export interface OpenRequestInput {
  riderId: string
  rideClass: RideClass
  pickup: { point: Point; address: string; placeId?: string | null }
  dropoff: { point: Point; address: string; placeId?: string | null }
  priceKobo: bigint
  paymentMethod: PaymentMethod
  paymentMethodId?: string | null
  isCollaboOptIn?: boolean
  expiresAt: Date
  estDistanceM?: number | null
  estDurationS?: number | null
}

/** Opens a ride request: the row, its first status_history row, and `trip.ride_request.opened`, in one transaction. */
export function openRequest(db: TripDb, input: OpenRequestInput, actor: Actor) {
  return withConflicts(() =>
    db.transaction(async (tx) => {
      const [request] = await tx
        .insert(rideRequests)
        .values({
          riderId: input.riderId,
          rideClass: input.rideClass,
          pickupPoint: input.pickup.point,
          pickupAddress: input.pickup.address,
          pickupPlaceId: input.pickup.placeId ?? null,
          dropoffPoint: input.dropoff.point,
          dropoffAddress: input.dropoff.address,
          dropoffPlaceId: input.dropoff.placeId ?? null,
          currentPriceKobo: input.priceKobo,
          paymentMethod: input.paymentMethod,
          paymentMethodId: input.paymentMethodId ?? null,
          isCollaboOptIn: input.isCollaboOptIn ?? false,
          expiresAt: input.expiresAt,
          estDistanceM: input.estDistanceM ?? null,
          estDurationS: input.estDurationS ?? null,
        })
        .returning()
      if (!request) throw new Error('ride request insert returned no row')
      await recordStatus(tx, {
        subjectType: 'ride_request',
        subjectId: request.id,
        fromStatus: null,
        toStatus: request.status,
        actor,
      })
      await writeOutbox(tx, requestOpened(request, actor.requestId))
      return request
    }),
  )
}
