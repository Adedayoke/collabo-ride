// Needs `pnpm infra:up`, `pnpm db:bootstrap`, and `pnpm db:migrate` (spec 0010, AC-1).
import type pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { findViolations, formatViolations } from './conventions'
import { adminUrl, connect, loadTestEnv } from './db.test-helpers'

loadTestEnv()
let admin: pg.Client

beforeAll(async () => {
  admin = await connect(adminUrl())
})
afterAll(() => admin.end())

describe('schema conventions', () => {
  it('pass in every service schema', async () => {
    const violations = await findViolations(admin)
    expect(violations, formatViolations(violations)).toEqual([])
  })

  it('catch a table that breaks them, and pass again once it is gone', async () => {
    await admin.query(`
      CREATE TABLE trip."BadProbe" (
        id serial PRIMARY KEY,
        fare_kobo numeric NOT NULL,
        seen_at timestamp NOT NULL,
        pickup_point public.geometry
      )
    `)
    await admin.query(`CREATE TYPE trip.probe_mood AS ENUM ('ok')`)
    try {
      const rules = (await findViolations(admin, ['trip'])).map((v) => v.rule).toSorted()
      expect(rules).toEqual([
        'money_bigint',
        'money_kobo',
        'no_enum',
        'point',
        'primary_key',
        'snake_case',
        'timestamptz',
      ])
    } finally {
      await admin.query('DROP TABLE trip."BadProbe"')
      await admin.query('DROP TYPE trip.probe_mood')
    }
    expect(await findViolations(admin, ['trip'])).toEqual([])
  })
})
