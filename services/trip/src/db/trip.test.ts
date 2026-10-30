// Integration tests against the compose Postgres (spec 0010, AC-3, AC-4, AC-5).
// Needs `pnpm infra:up` and `pnpm db:migrate`. Every test uses fresh ids.
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { type Actor, pgErrorMessage, toPoint, transition, violatedUniqueIndex } from '@collabo/service-kit'
import { eq, sql } from 'drizzle-orm'
import { afterAll, describe, expect, it } from 'vitest'
import { acceptRequest } from './accept'
import { createTripDb } from './client'
import { openRequest } from './requests'
import { offers, tripRiders, trips } from './schema'
import { driverTripView, riderTripHistory, riderTripView } from './views'

if (existsSync('.env')) process.loadEnvFile('.env')
const url = process.env.DATABASE_URL
if (!url) throw new Error('Set DATABASE_URL (see .env.example)')
const { db, pool } = createTripDb(url)

afterAll(() => pool.end())

const lagos = toPoint(3.3792, 6.5244)
const ikeja = toPoint(3.3515, 6.6018)
const actor = (role: Actor['role'], id: string | null): Actor => ({ id, role, requestId: randomUUID() })
const inTenMinutes = () => new Date(Date.now() + 10 * 60_000)

const driverCard = {
  firstName: 'Tunde',
  lastInitial: 'A',
  photoKey: null,
  rating: 4.9,
  vehicle: { make: 'Toyota', model: 'Corolla', colour: 'Silver', plate: 'LND 123 AB' },
}
const riderCard = (firstName: string) => ({ firstName, lastInitial: 'O', photoKey: null, rating: null })

function open(riderId: string, priceKobo: bigint) {
  return openRequest(
    db,
    {
      riderId,
      rideClass: 'economy',
      pickup: { point: lagos, address: 'Broad Street, Lagos Island' },
      dropoff: { point: ikeja, address: 'Allen Avenue, Ikeja' },
      priceKobo,
      paymentMethod: 'cash',
      expiresAt: inTenMinutes(),
    },
    actor('rider', riderId),
  )
}

function accept(requestId: string, driverId: string, joinTripId?: string) {
  return acceptRequest(
    db,
    {
      requestId,
      priceVersion: 1,
      driverId,
      vehicleId: randomUUID(),
      driverSnapshot: driverCard,
      riderSnapshot: riderCard('Ada'),
      joinTripId,
    },
    actor('driver', driverId),
  )
}

/** Error code from an AppError, or the unique index a raw insert violated. */
const errorCode = (err: unknown) =>
  typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string' && !/^\d/.test(err.code)
    ? err.code
    : violatedUniqueIndex(err)

async function failure(work: Promise<unknown>) {
  try {
    await work
  } catch (err) {
    return errorCode(err) ?? pgErrorMessage(err) ?? String(err)
  }
  throw new Error('expected a failure')
}

/** Two riders on one driver's trip: Ada pays 150000, Bola pays 120000. */
async function collaboFixture() {
  const driverId = randomUUID()
  const ada = randomUUID()
  const bola = randomUUID()
  const first = await accept((await open(ada, 150000n)).id, driverId)
  const second = await accept((await open(bola, 120000n)).id, driverId, first.tripId)
  return { driverId, ada, bola, tripId: first.tripId, adaRow: first.tripRiderId, bolaRow: second.tripRiderId }
}

const json = (value: unknown) => JSON.stringify(value, (_k, v: unknown) => (typeof v === 'bigint' ? v.toString() : v))

describe('fare privacy (AC-4)', () => {
  it('shows each rider only their own row, with their own fare and PIN', async () => {
    const f = await collaboFixture()
    const [bolaRow] = await db.select().from(tripRiders).where(eq(tripRiders.id, f.bolaRow))
    const adaView = await riderTripView(db, f.ada, f.tripId)

    expect(adaView?.me.id).toBe(f.adaRow)
    expect(adaView?.me.agreedFareKobo).toBe(150000n)
    expect(adaView?.me.pin).toMatch(/^\d{4}$/)
    expect(adaView?.isShared).toBe(true)
    const seen = json(adaView)
    expect(seen).not.toContain(f.bolaRow)
    expect(seen).not.toContain(f.bola)
    expect(seen).not.toContain('120000')
    expect(bolaRow?.pin).toMatch(/^\d{4}$/)
    expect(Object.keys(adaView ?? {})).toEqual(['trip', 'me', 'isShared'])

    const bolaView = await riderTripView(db, f.bola, f.tripId)
    expect(bolaView?.me.id).toBe(f.bolaRow)
    expect(json(bolaView)).not.toContain('150000')
  })

  it('returns nothing for a trip the rider is not on', async () => {
    const f = await collaboFixture()
    expect(await riderTripView(db, randomUUID(), f.tripId)).toBeNull()
  })

  it('keeps a rider history to their own rows', async () => {
    const f = await collaboFixture()
    const { rides, nextCursor } = await riderTripHistory(db, f.ada)
    expect(rides.map((r) => r.me.id)).toEqual([f.adaRow])
    expect(nextCursor).toBeNull()
    expect(json(rides)).not.toContain('120000')
  })

  it('shows the driver every rider row and never a PIN', async () => {
    const f = await collaboFixture()
    const view = await driverTripView(db, f.driverId, f.tripId)
    expect(view?.riders.map((r) => r.id)).toEqual([f.adaRow, f.bolaRow])
    expect(view?.riders.map((r) => r.agreedFareKobo)).toEqual([150000n, 120000n])
    for (const rider of view?.riders ?? []) expect(rider).not.toHaveProperty('pin')
    expect(await driverTripView(db, randomUUID(), f.tripId)).toBeNull()
  })
})

describe('exclusivity (AC-5)', () => {
  it('rejects a second open request from the same rider', async () => {
    const rider = randomUUID()
    await open(rider, 100000n)
    expect(await failure(open(rider, 100000n))).toBe('active_request_exists')
  })

  it('lets exactly one of two drivers win a request at the same time', async () => {
    const request = await open(randomUUID(), 100000n)
    const drivers = [randomUUID(), randomUUID()]
    const results = await Promise.allSettled(drivers.map((d) => accept(request.id, d)))
    const won = results.filter((r) => r.status === 'fulfilled')
    const lost = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    expect(won).toHaveLength(1)
    expect(lost).toHaveLength(1)
    expect(errorCode(lost[0]?.reason)).toBe('request_not_open')

    const live = await db.select().from(tripRiders).where(eq(tripRiders.requestId, request.id))
    expect(live).toHaveLength(1)
    const loser = drivers[results.findIndex((r) => r.status === 'rejected')]
    const loserTrips = await db
      .select()
      .from(trips)
      .where(eq(trips.driverId, loser ?? ''))
    expect(loserTrips).toHaveLength(0)
    const loserEvents = await db.execute(sql`SELECT 1 FROM trip.outbox WHERE payload ->> 'driver_id' = ${loser ?? ''}`)
    expect(loserEvents.rows).toHaveLength(0)
  })

  it('backs the accept up with an index when a rider row skips the conditional update', async () => {
    const solo = await accept((await open(randomUUID(), 100000n)).id, randomUUID())
    const [row] = await db.select().from(tripRiders).where(eq(tripRiders.id, solo.tripRiderId))
    if (!row) throw new Error('fixture row missing')
    const { id: _id, createdAt: _c, updatedAt: _u, version: _v, ...copy } = row
    expect(await failure(db.insert(tripRiders).values({ ...copy, joinOrder: 2, riderId: randomUUID() }))).toBe(
      'trip_riders_one_live_per_request',
    )
  })

  it('rejects a second active trip for one driver', async () => {
    const driverId = randomUUID()
    await accept((await open(randomUUID(), 100000n)).id, driverId)
    expect(await failure(accept((await open(randomUUID(), 100000n)).id, driverId))).toBe('driver_busy')
  })

  it('rejects a second active trip for one rider', async () => {
    const rider = randomUUID()
    await accept((await open(rider, 100000n)).id, randomUUID())
    expect(await failure(accept((await open(rider, 100000n)).id, randomUUID()))).toBe('rider_on_trip')
  })

  it('rejects a second live offer from one driver on one request', async () => {
    const request = await open(randomUUID(), 100000n)
    const offer = {
      requestId: request.id,
      driverId: randomUUID(),
      vehicleId: randomUUID(),
      kind: 'counter' as const,
      priceKobo: 120000n,
      priceVersion: 1,
      expiresAt: inTenMinutes(),
      driverSnapshot: driverCard,
    }
    await db.insert(offers).values(offer)
    expect(await failure(db.insert(offers).values(offer))).toBe('offers_one_live_per_driver')
  })

  it('answers offer_stale when the rider changed the price', async () => {
    const request = await open(randomUUID(), 100000n)
    await db.execute(sql`UPDATE trip.ride_requests SET price_version = 2 WHERE id = ${request.id}`)
    expect(await failure(accept(request.id, randomUUID()))).toBe('offer_stale')
  })
})

describe('status changes (AC-3)', () => {
  it('writes the row, its history, and its outbox row together', async () => {
    const request = await open(randomUUID(), 100000n)
    await accept(request.id, randomUUID())
    const history = await db.execute(
      sql`SELECT from_status, to_status, actor_role FROM trip.status_history WHERE subject_id = ${request.id} ORDER BY created_at`,
    )
    expect(history.rows).toEqual([
      { from_status: null, to_status: 'open', actor_role: 'rider' },
      { from_status: 'open', to_status: 'matched', actor_role: 'driver' },
    ])
    const events = await db.execute(
      sql`SELECT type, subject_seq FROM trip.outbox WHERE payload ->> 'id' = ${request.id} ORDER BY created_at`,
    )
    expect(events.rows).toEqual([
      { type: 'trip.ride_request.opened', subject_seq: '1' },
      { type: 'trip.ride_request.closed', subject_seq: '2' },
    ])
  })

  it('leaves none of the three when the transaction fails', async () => {
    const request = await open(randomUUID(), 100000n)
    await expect(
      db.transaction(async (tx) => {
        await transition(tx, {
          table: 'ride_requests',
          subjectType: 'ride_request',
          id: request.id,
          from: ['open'],
          to: 'cancelled',
          actor: actor('rider', request.riderId),
          events: ({ version }) => [
            {
              stream: 'trip',
              type: 'trip.ride_request.closed',
              payload: { id: request.id },
              subjectType: 'ride_request',
              subjectSeq: version,
              requestId: 'test',
            },
          ],
        })
        throw new Error('forced failure')
      }),
    ).rejects.toThrow('forced failure')

    const [row] = await db
      .execute<{ status: string; version: string }>(
        sql`SELECT status, version FROM trip.ride_requests WHERE id = ${request.id}`,
      )
      .then((r) => r.rows)
    expect(row).toEqual({ status: 'open', version: '1' })
    const history = await db.execute(
      sql`SELECT 1 FROM trip.status_history WHERE subject_id = ${request.id} AND to_status = 'cancelled'`,
    )
    expect(history.rows).toHaveLength(0)
    const events = await db.execute(
      sql`SELECT 1 FROM trip.outbox WHERE payload ->> 'id' = ${request.id} AND type = 'trip.ride_request.closed'`,
    )
    expect(events.rows).toHaveLength(0)
  })

  it('returns null and changes nothing when the row is not in a from status', async () => {
    const request = await open(randomUUID(), 100000n)
    const result = await db.transaction((tx) =>
      transition(tx, {
        table: 'ride_requests',
        subjectType: 'ride_request',
        id: request.id,
        from: ['matched'],
        to: 'open',
        actor: actor('system', null),
        events: () => [],
      }),
    )
    expect(result).toBeNull()
  })
})
