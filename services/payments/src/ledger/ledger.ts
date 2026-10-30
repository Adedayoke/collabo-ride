import { AppError } from '@collabo/service-kit'
import { type Executor, pgErrorMessage } from '@collabo/service-kit/db'
import { sql } from 'drizzle-orm'

/** Entry kinds (spec 0010.3); the database CHECK holds the same list. */
export const ENTRY_KINDS = [
  'rider_payment',
  'cash_commission',
  'topup',
  'refund',
  'payout_request',
  'payout_paid',
  'payout_failed',
  'referral_reward',
  'adjustment',
] as const
export type EntryKind = (typeof ENTRY_KINDS)[number]

export const USER_ACCOUNT_KINDS = ['rider_wallet', 'driver'] as const
export type UserAccountKind = (typeof USER_ACCOUNT_KINDS)[number]

export const SYSTEM_ACCOUNT_KINDS = [
  'platform_revenue',
  'promo_expense',
  'referral_expense',
  'provider_clearing',
  'payout_clearing',
] as const
export type SystemAccountKind = (typeof SYSTEM_ACCOUNT_KINDS)[number]

/** One line of an entry. Positive is money the platform owes the account's owner. */
export interface LedgerLine {
  accountId: string
  amountKobo: bigint
}

export interface Posting {
  /** Deterministic key, for example `rider_payment:<rider_charge_id>` (spec 0010.3, Idempotency key formats). */
  idempotencyKey: string
  kind: EntryKind
  sourceType: string
  sourceId: string
  memo?: string | null
  lines: readonly LedgerLine[]
  /** Accounts that may not end below zero, for example a driver requesting a payout. */
  mustStayNonNegative?: readonly string[]
  createdBy?: string | null
}

/** Errors post_journal_entry raises that a caller can act on. */
const POSTING_ERRORS: Record<string, AppError> = {
  insufficient_balance: new AppError(409, 'insufficient_balance', 'The account balance is too low for this payment'),
  idempotency_key_reused: new AppError(
    409,
    'idempotency_key_reused',
    'This key was already used for a different entry',
  ),
}

function mapPostingError(err: unknown): unknown {
  const message = pgErrorMessage(err)
  return (message !== undefined && POSTING_ERRORS[message]) || err
}

/**
 * Writes one balanced entry through post_journal_entry(). Posting the same key
 * again returns the first entry and adds no lines. The zero sum check runs at
 * commit, so call this inside the caller's transaction, once per transaction.
 */
export async function postJournalEntry(db: Executor, posting: Posting): Promise<string> {
  for (const line of posting.lines) {
    if (line.amountKobo === 0n) throw new Error('A ledger line cannot be zero')
  }
  const lines = JSON.stringify(
    posting.lines.map((l) => ({ account_id: l.accountId, amount_kobo: l.amountKobo.toString() })),
  )
  const mustStay = posting.mustStayNonNegative ?? []
  try {
    const result = await db.execute<{ id: string }>(sql`
      SELECT post_journal_entry(
        ${posting.idempotencyKey}, ${posting.kind}, ${posting.sourceType}, ${posting.sourceId},
        ${posting.memo ?? null}, ${lines}::jsonb, ${`{${mustStay.join(',')}}`}::uuid[], ${posting.createdBy ?? null}
      ) AS id
    `)
    const id = result.rows[0]?.id
    if (!id) throw new Error('post_journal_entry returned no id')
    return id
  } catch (err) {
    throw mapPostingError(err)
  }
}

/** The user's account of this kind, created on first use. */
export async function ensureLedgerAccount(db: Executor, ownerId: string, kind: UserAccountKind): Promise<string> {
  const result = await db.execute<{ id: string }>(sql`SELECT ensure_ledger_account(${ownerId}, ${kind}) AS id`)
  const id = result.rows[0]?.id
  if (!id) throw new Error('ensure_ledger_account returned no id')
  return id
}

/** One of the seeded system accounts. */
export async function systemAccountId(db: Executor, kind: SystemAccountKind): Promise<string> {
  const result = await db.execute<{ id: string }>(
    sql`SELECT id FROM ledger_accounts WHERE owner_type = 'system' AND kind = ${kind}`,
  )
  const id = result.rows[0]?.id
  if (!id) throw new Error(`System account ${kind} is missing; run the payments migrations`)
  return id
}

/** An account's balance: the sum of its lines (there is no stored balance). */
export async function balanceKobo(db: Executor, accountId: string): Promise<bigint> {
  const result = await db.execute<{ balance: string }>(
    sql`SELECT coalesce(sum(amount_kobo), 0)::text AS balance FROM journal_lines WHERE account_id = ${accountId}`,
  )
  return BigInt(result.rows[0]?.balance ?? '0')
}
