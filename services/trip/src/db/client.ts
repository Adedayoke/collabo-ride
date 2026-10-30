import { createPool } from '@collabo/service-kit/db'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import type pg from 'pg'
import * as schema from './schema'

export type TripDb = NodePgDatabase<typeof schema>
/** A transaction opened with `db.transaction`. */
export type TripTx = Parameters<Parameters<TripDb['transaction']>[0]>[0]
/** Either; reads and single statements accept both. */
export type TripExecutor = TripDb | TripTx

export function createTripDb(url: string): { db: TripDb; pool: pg.Pool } {
  const pool = createPool(url)
  return { db: drizzle(pool, { schema }), pool }
}
