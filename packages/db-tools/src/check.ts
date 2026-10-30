// `pnpm db:check`: the convention check against every service schema (spec 0010, AC-1).
import { Client } from 'pg'
import { findViolations, formatViolations } from './conventions'

const url = process.env.DB_ADMIN_URL
if (!url) throw new Error('Set DB_ADMIN_URL (see packages/db-tools/.env.example)')

const client = new Client({ connectionString: url })
await client.connect()
try {
  const violations = await findViolations(client)
  if (violations.length > 0) {
    console.error(`Schema conventions failed:\n${formatViolations(violations)}`)
    process.exitCode = 1
  } else {
    console.log('Schema conventions pass in every service schema.')
  }
} finally {
  await client.end()
}
