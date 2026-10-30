import { sql } from 'drizzle-orm'
import type { Executor } from './executor'

/** One event row, committed in the same transaction as the change it describes. */
export interface OutboxEvent {
  stream: string
  /** `<service>.<entity>.<past_verb>` (spec 0011). */
  type: string
  /** The entity's full public state after the change. */
  payload: Record<string, unknown>
  subjectType: string
  /** The subject row's `version` after the change. */
  subjectSeq: number
  requestId: string
  traceparent?: string | null
}

export async function writeOutbox(tx: Executor, event: OutboxEvent): Promise<void> {
  await tx.execute(sql`
    INSERT INTO outbox (stream, type, payload, subject_type, subject_seq, request_id, traceparent)
    VALUES (${event.stream}, ${event.type}, ${JSON.stringify(event.payload)}::jsonb, ${event.subjectType},
            ${event.subjectSeq}, ${event.requestId}, ${event.traceparent ?? null})
  `)
}
