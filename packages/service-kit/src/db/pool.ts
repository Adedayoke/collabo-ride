import { Pool } from 'pg'

/** One pool per service, using that service's own role (spec 0009). */
export function createPool(connectionString: string, max = 10): Pool {
  const pool = new Pool({ connectionString, max })
  pool.on('error', (err) => console.error('idle Postgres client error', err))
  return pool
}
