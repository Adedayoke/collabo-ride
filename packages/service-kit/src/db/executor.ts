import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type { PgDatabase } from 'drizzle-orm/pg-core'

/** Anything that can run SQL: a Drizzle database or a transaction inside one. */
export type Executor = Pick<PgDatabase<NodePgQueryResultHKT>, 'execute'>
