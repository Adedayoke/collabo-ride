import { type SQL, sql } from 'drizzle-orm'
import type { Role } from '../context'
import type { Executor } from './executor'
import { type OutboxEvent, writeOutbox } from './outbox'

/** Who caused a change: the signed request context, or `system` for jobs and consumers. */
export interface Actor {
  id: string | null
  role: Role
  requestId: string
}

export interface TransitionResult {
  fromStatus: string
  version: number
}

export interface TransitionInput {
  /** Table in the service's own schema; it must have `id`, `status`, and `version`. */
  table: string
  subjectType: string
  id: string
  from: readonly string[]
  to: string
  /** Extra assignments, for example sql`matched_at = now()`. */
  set?: SQL
  /** Extra guard on the row, for example sql`price_version = ${v}`. */
  where?: SQL
  actor: Actor
  reason?: string | null
  /** The events this change publishes, built once the new version is known. */
  events: (changed: TransitionResult) => OutboxEvent[] | Promise<OutboxEvent[]>
}

/**
 * The one way a status changes (spec 0010, Concurrency): a conditional update,
 * its status_history row, and its outbox rows, all on the caller's transaction.
 * Returns null when no row matched, which the caller maps to a 409.
 */
export async function transition(tx: Executor, input: TransitionInput): Promise<TransitionResult | null> {
  const table = sql.identifier(input.table)
  const fromList = sql.join(
    input.from.map((s) => sql`${s}`),
    sql`, `,
  )
  const result = await tx.execute<{ from_status: string; version: string }>(sql`
    WITH prev AS (
      SELECT id, status FROM ${table}
      WHERE id = ${input.id} AND status IN (${fromList}) ${input.where ? sql`AND ${input.where}` : sql``}
      FOR UPDATE
    )
    UPDATE ${table} AS t
    SET status = ${input.to}, version = t.version + 1 ${input.set ? sql`, ${input.set}` : sql``}
    FROM prev
    WHERE t.id = prev.id
    RETURNING prev.status AS from_status, t.version
  `)
  const row = result.rows[0]
  if (!row) return null
  const changed: TransitionResult = { fromStatus: row.from_status, version: Number(row.version) }

  await recordStatus(tx, {
    subjectType: input.subjectType,
    subjectId: input.id,
    fromStatus: changed.fromStatus,
    toStatus: input.to,
    actor: input.actor,
    reason: input.reason ?? null,
  })
  for (const event of await input.events(changed)) await writeOutbox(tx, event)
  return changed
}

export interface StatusRecord {
  subjectType: string
  subjectId: string
  fromStatus: string | null
  toStatus: string
  actor: Actor
  reason?: string | null
}

/** A status_history row on its own, for a row's first status (an insert, not an update). */
export async function recordStatus(tx: Executor, r: StatusRecord): Promise<void> {
  await tx.execute(sql`
    INSERT INTO status_history (subject_type, subject_id, from_status, to_status, actor_id, actor_role, reason, request_id)
    VALUES (${r.subjectType}, ${r.subjectId}, ${r.fromStatus}, ${r.toStatus}, ${r.actor.id}, ${r.actor.role},
            ${r.reason ?? null}, ${r.actor.requestId})
  `)
}
