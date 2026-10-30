// Integration tests against the compose Postgres (spec 0010, AC-6). Needs
// `pnpm infra:up`, `pnpm db:bootstrap`, and `pnpm db:migrate`. Ledger rows are
// immutable by design, so every test uses fresh owners and keys.
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { createPool, pgErrorMessage } from '@collabo/service-kit'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { balanceKobo, ensureLedgerAccount, postJournalEntry, systemAccountId } from './ledger'

if (existsSync('.env')) process.loadEnvFile('.env')
const serviceUrl = process.env.DATABASE_URL
const ownerUrl = process.env.MIGRATION_DATABASE_URL
if (!serviceUrl || !ownerUrl) throw new Error('Set DATABASE_URL and MIGRATION_DATABASE_URL (see .env.example)')

const servicePool = createPool(serviceUrl)
const ownerPool = createPool(ownerUrl, 2)
const db = drizzle(servicePool)
const ownerDb = drizzle(ownerPool)

afterAll(async () => {
  await Promise.all([servicePool.end(), ownerPool.end()])
})

/** Matches the Postgres error message under Drizzle's wrapper. */
const pgError = (pattern: RegExp) => (err: unknown) => pattern.test(pgErrorMessage(err) ?? '')

const key = (kind: string) => `${kind}:${randomUUID()}`

async function fundedWallet(kobo: bigint) {
  const wallet = await ensureLedgerAccount(db, randomUUID(), 'rider_wallet')
  const clearing = await systemAccountId(db, 'provider_clearing')
  await db.transaction((tx) =>
    postJournalEntry(tx, {
      idempotencyKey: key('topup'),
      kind: 'topup',
      sourceType: 'topup',
      sourceId: randomUUID(),
      lines: [
        { accountId: clearing, amountKobo: -kobo },
        { accountId: wallet, amountKobo: kobo },
      ],
    }),
  )
  return wallet
}

describe('ledger accounts', () => {
  it('creates a user account once and returns it after', async () => {
    const owner = randomUUID()
    const first = await ensureLedgerAccount(db, owner, 'driver')
    expect(await ensureLedgerAccount(db, owner, 'driver')).toBe(first)
  })

  it('has every system account seeded', async () => {
    for (const kind of [
      'platform_revenue',
      'promo_expense',
      'referral_expense',
      'provider_clearing',
      'payout_clearing',
    ] as const) {
      await expect(systemAccountId(db, kind)).resolves.toMatch(/^[0-9a-f-]{36}$/)
    }
  })
})

describe('post_journal_entry', () => {
  it('posts a balanced card trip and moves each balance', async () => {
    const driver = await ensureLedgerAccount(db, randomUUID(), 'driver')
    const clearing = await systemAccountId(db, 'provider_clearing')
    const revenue = await systemAccountId(db, 'platform_revenue')
    await db.transaction((tx) =>
      postJournalEntry(tx, {
        idempotencyKey: key('rider_payment'),
        kind: 'rider_payment',
        sourceType: 'rider_charge',
        sourceId: randomUUID(),
        lines: [
          { accountId: clearing, amountKobo: -200000n },
          { accountId: driver, amountKobo: 160000n },
          { accountId: revenue, amountKobo: 40000n },
        ],
      }),
    )
    expect(await balanceKobo(db, driver)).toBe(160000n)
  })

  it('rejects an entry whose lines do not sum to zero, at commit', async () => {
    const driver = await ensureLedgerAccount(db, randomUUID(), 'driver')
    const revenue = await systemAccountId(db, 'platform_revenue')
    const k = key('adjustment')
    await expect(
      db.transaction((tx) =>
        postJournalEntry(tx, {
          idempotencyKey: k,
          kind: 'adjustment',
          sourceType: 'test',
          sourceId: randomUUID(),
          lines: [
            { accountId: driver, amountKobo: 100n },
            { accountId: revenue, amountKobo: -99n },
          ],
        }),
      ),
    ).rejects.toThrow()
    const left = await db.execute(sql`SELECT 1 FROM journal_entries WHERE idempotency_key = ${k}`)
    expect(left.rows).toHaveLength(0)
  })

  it('rejects an entry with no lines, at commit', async () => {
    const k = key('adjustment')
    await expect(
      db.transaction((tx) =>
        postJournalEntry(tx, {
          idempotencyKey: k,
          kind: 'adjustment',
          sourceType: 'test',
          sourceId: randomUUID(),
          lines: [],
        }),
      ),
    ).rejects.toThrow()
    await expect(
      db.execute(sql`
        INSERT INTO journal_entries (kind, idempotency_key, request_hash, source_type, source_id)
        VALUES ('adjustment', ${key('adjustment')}, 'x', 'test', ${randomUUID()})
      `),
    ).rejects.toThrow()
  })

  it('refuses to take a wallet below zero', async () => {
    const wallet = await fundedWallet(50000n)
    const driver = await ensureLedgerAccount(db, randomUUID(), 'driver')
    const revenue = await systemAccountId(db, 'platform_revenue')
    await expect(
      db.transaction((tx) =>
        postJournalEntry(tx, {
          idempotencyKey: key('rider_payment'),
          kind: 'rider_payment',
          sourceType: 'rider_charge',
          sourceId: randomUUID(),
          lines: [
            { accountId: wallet, amountKobo: -60000n },
            { accountId: driver, amountKobo: 48000n },
            { accountId: revenue, amountKobo: 12000n },
          ],
        }),
      ),
    ).rejects.toMatchObject({ code: 'insufficient_balance' })
    expect(await balanceKobo(db, wallet)).toBe(50000n)
  })

  it('keeps a driver asked to stay non negative from going below zero', async () => {
    const driver = await ensureLedgerAccount(db, randomUUID(), 'driver')
    const payouts = await systemAccountId(db, 'payout_clearing')
    await expect(
      db.transaction((tx) =>
        postJournalEntry(tx, {
          idempotencyKey: key('payout_request'),
          kind: 'payout_request',
          sourceType: 'payout',
          sourceId: randomUUID(),
          lines: [
            { accountId: driver, amountKobo: -1000000n },
            { accountId: payouts, amountKobo: 1000000n },
          ],
          mustStayNonNegative: [driver],
        }),
      ),
    ).rejects.toMatchObject({ code: 'insufficient_balance' })
  })

  it('returns the original entry for a replayed key and adds no lines', async () => {
    const wallet = await fundedWallet(10000n)
    const clearing = await systemAccountId(db, 'provider_clearing')
    const posting = {
      idempotencyKey: key('topup'),
      kind: 'topup' as const,
      sourceType: 'topup',
      sourceId: randomUUID(),
      lines: [
        { accountId: clearing, amountKobo: -5000n },
        { accountId: wallet, amountKobo: 5000n },
      ],
    }
    const first = await db.transaction((tx) => postJournalEntry(tx, posting))
    const again = await db.transaction((tx) => postJournalEntry(tx, posting))
    expect(again).toBe(first)
    const lines = await db.execute(sql`SELECT count(*)::int AS n FROM journal_lines WHERE entry_id = ${first}`)
    expect(lines.rows[0]).toEqual({ n: 2 })
    expect(await balanceKobo(db, wallet)).toBe(15000n)
  })

  it('rejects a reused key with different lines', async () => {
    const wallet = await ensureLedgerAccount(db, randomUUID(), 'rider_wallet')
    const clearing = await systemAccountId(db, 'provider_clearing')
    const k = key('topup')
    const sourceId = randomUUID()
    const lines = (kobo: bigint) => [
      { accountId: clearing, amountKobo: -kobo },
      { accountId: wallet, amountKobo: kobo },
    ]
    await db.transaction((tx) =>
      postJournalEntry(tx, { idempotencyKey: k, kind: 'topup', sourceType: 'topup', sourceId, lines: lines(100n) }),
    )
    await expect(
      db.transaction((tx) =>
        postJournalEntry(tx, { idempotencyKey: k, kind: 'topup', sourceType: 'topup', sourceId, lines: lines(200n) }),
      ),
    ).rejects.toMatchObject({ code: 'idempotency_key_reused' })
  })
})

describe('journal immutability', () => {
  // Row triggers only fire on rows, so make sure there is one.
  beforeAll(() => fundedWallet(1000n))

  for (const table of ['journal_entries', 'journal_lines'] as const) {
    it(`the payments role cannot update, delete, or truncate ${table}`, async () => {
      await expect(db.execute(sql`UPDATE ${sql.identifier(table)} SET created_at = now()`)).rejects.toThrow()
      await expect(db.execute(sql`DELETE FROM ${sql.identifier(table)}`)).rejects.toThrow()
      await expect(db.execute(sql`TRUNCATE ${sql.identifier(table)} CASCADE`)).rejects.toThrow()
    })

    it(`even the owner role is stopped by the ${table} triggers`, async () => {
      await expect(ownerDb.execute(sql`UPDATE ${sql.identifier(table)} SET created_at = now()`)).rejects.toSatisfy(
        pgError(/journal_immutable/),
      )
      await expect(ownerDb.execute(sql`DELETE FROM ${sql.identifier(table)}`)).rejects.toSatisfy(
        pgError(/journal_immutable/),
      )
      await expect(ownerDb.execute(sql`TRUNCATE ${sql.identifier(table)} CASCADE`)).rejects.toSatisfy(
        pgError(/journal_immutable/),
      )
    })
  }
})
