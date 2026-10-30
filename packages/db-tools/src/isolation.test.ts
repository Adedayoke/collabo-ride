// Each service role reaches only its own schema (spec 0010, AC-2). Needs
// `pnpm infra:up`, `pnpm db:bootstrap`, and `pnpm db:migrate`.
import type pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { SERVICE_SCHEMAS } from './conventions'
import { adminUrl, connect, loadTestEnv, roleUrl, sqlState } from './db.test-helpers'

loadTestEnv()

const INSUFFICIENT_PRIVILEGE = '42501'
const clients = new Map<string, pg.Client>()

beforeAll(async () => {
  for (const role of SERVICE_SCHEMAS) clients.set(role, await connect(roleUrl(role)))
})
afterAll(async () => {
  await Promise.all([...clients.values()].map((c) => c.end()))
})

function client(role: string): pg.Client {
  const c = clients.get(role)
  if (!c) throw new Error(`no connection for ${role}`)
  return c
}

describe('schema isolation', () => {
  for (const role of SERVICE_SCHEMAS) {
    for (const other of SERVICE_SCHEMAS.filter((s) => s !== role)) {
      it(`${role} cannot read or write ${other}`, async () => {
        const c = client(role)
        expect(await sqlState(c, `SELECT * FROM ${other}.status_history LIMIT 1`)).toBe(INSUFFICIENT_PRIVILEGE)
        expect(
          await sqlState(
            c,
            `INSERT INTO ${other}.processed_events (event_id, consumer, stream) VALUES (uuidv7(), 'probe', 'probe')`,
          ),
        ).toBe(INSUFFICIENT_PRIVILEGE)
        expect(await sqlState(c, `CREATE TABLE ${other}.probe (id uuid)`)).toBe(INSUFFICIENT_PRIVILEGE)
      })
    }

    it(`${role} can read its own schema`, async () => {
      expect(await sqlState(client(role), `SELECT * FROM ${role}.status_history LIMIT 1`)).toBeUndefined()
    })
  }

  it('the trip role cannot read the payments ledger', async () => {
    expect(await sqlState(client('trip'), 'SELECT * FROM payments.journal_lines')).toBe(INSUFFICIENT_PRIVILEGE)
  })

  it('no foreign key crosses a schema boundary', async () => {
    const admin = await connect(adminUrl())
    try {
      const crossing = await admin.query(
        `SELECT con.conname, src.nspname AS from_schema, dst.nspname AS to_schema
         FROM pg_constraint AS con
         JOIN pg_class AS sc ON sc.oid = con.conrelid
         JOIN pg_namespace AS src ON src.oid = sc.relnamespace
         JOIN pg_class AS dc ON dc.oid = con.confrelid
         JOIN pg_namespace AS dst ON dst.oid = dc.relnamespace
         WHERE con.contype = 'f' AND src.nspname = ANY ($1) AND src.nspname <> dst.nspname`,
        [SERVICE_SCHEMAS],
      )
      expect(crossing.rows).toEqual([])
    } finally {
      await admin.end()
    }
  })
})
