// Applies this service's migrations under the role that owns its schema
// (spec 0009, Migrations). Run with `pnpm db:migrate`.
import { runMigrations } from '@collabo/service-kit'

const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL
if (!url) throw new Error('Set DATABASE_URL (or MIGRATION_DATABASE_URL) to run migrations')

const applied = await runMigrations({ url, schema: 'trip' })
console.log(`trip: applied ${applied} migration(s)`)
