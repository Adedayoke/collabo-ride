import { sql } from 'drizzle-orm'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { drizzle } from 'drizzle-orm/node-postgres'
import { createPool } from './pool'

export interface MigrateOptions {
  /** The role that owns the schema: MIGRATION_DATABASE_URL when set, else DATABASE_URL. */
  url: string
  /** The service's own schema, which already exists (postgres-init). */
  schema: string
  /** Folder drizzle-kit generates into. */
  folder?: string
}

/**
 * Applies drizzle-kit migrations, keeping drizzle's own bookkeeping table so
 * `drizzle-kit generate` stays in step. Drizzle's migrator always runs
 * `CREATE SCHEMA IF NOT EXISTS`, which Postgres refuses without CREATE on the
 * database, a right no service role has (spec 0009, schema isolation). The
 * schema exists already, so this runner skips that one statement.
 */
export async function runMigrations({ url, schema, folder = 'drizzle' }: MigrateOptions): Promise<number> {
  const migrations = readMigrationFiles({ migrationsFolder: folder })
  const pool = createPool(url, 1)
  const db = drizzle(pool)
  const table = sql`${sql.identifier(schema)}.${sql.identifier('__drizzle_migrations')}`
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${table} (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)
    `)
    const last = await db.execute<{ created_at: string }>(
      sql`SELECT created_at FROM ${table} ORDER BY created_at DESC LIMIT 1`,
    )
    const lastMillis = last.rows[0] ? Number(last.rows[0].created_at) : -1
    const pending = migrations.filter((m) => m.folderMillis > lastMillis)
    await db.transaction(async (tx) => {
      for (const migration of pending) {
        for (const statement of migration.sql) {
          if (statement.trim()) await tx.execute(sql.raw(statement))
        }
        await tx.execute(
          sql`INSERT INTO ${table} (hash, created_at) VALUES (${migration.hash}, ${migration.folderMillis})`,
        )
      }
    })
    return pending.length
  } finally {
    await pool.end()
  }
}
