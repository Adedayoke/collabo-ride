import { readFileSync } from 'node:fs'
import type pg from 'pg'

/** Every schema a service owns (spec 0009). */
export const SERVICE_SCHEMAS = ['accounts', 'trip', 'dispatch', 'payments', 'notifications', 'fraud'] as const

/** Tables keyed by another id, so they have no `id` column (spec 0010, AC-1). */
export const KEYED_ELSEWHERE = [
  'driver_profiles',
  'staff_members',
  'referrals',
  'class_rules',
  'class_fare_rules',
  'rating_summaries',
  'alert_preferences',
  'driver_eligibility',
  'match_facts',
  'trip_breadcrumbs',
  'processed_events',
  // Added with #16 (spec 0010.3): keyed by driver_id.
  'driver_cash_states',
] as const

export interface Violation {
  schema_name: string
  table_name: string
  column_name: string | null
  rule: string
  detail: string
}

const CONVENTIONS_SQL = readFileSync(new URL('./conventions.sql', import.meta.url), 'utf8')

/** Runs the convention check; an empty list means every schema passes. */
export async function findViolations(
  client: pg.ClientBase | pg.Pool,
  schemas: readonly string[] = SERVICE_SCHEMAS,
): Promise<Violation[]> {
  const result = await client.query<Violation>(CONVENTIONS_SQL, [schemas, KEYED_ELSEWHERE])
  return result.rows
}

export function formatViolations(violations: readonly Violation[]): string {
  return violations
    .map((v) => `${v.schema_name}.${v.table_name}${v.column_name ? `.${v.column_name}` : ''}  [${v.rule}] ${v.detail}`)
    .join('\n')
}
