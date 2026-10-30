// Tables arrive with the features that first need them (spec 0010, Arrival map),
// declared on this schema. drizzle-kit emits CREATE SCHEMA for the first table:
// delete that line (postgres-init owns schemas; the migration guard rejects it).
import { pgSchema } from 'drizzle-orm/pg-core'

export const paymentsSchema = pgSchema('payments')
