import { existsSync } from 'node:fs'
import { Client } from 'pg'

const COMPOSE_ENV = new URL('../../../infra/compose/.env', import.meta.url)

/** Loads this package's .env and the compose .env (role passwords), when present. */
export function loadTestEnv(): void {
  if (existsSync('.env')) process.loadEnvFile('.env')
  if (existsSync(COMPOSE_ENV)) process.loadEnvFile(COMPOSE_ENV)
}

export function adminUrl(): string {
  const url = process.env.DB_ADMIN_URL
  if (!url) throw new Error('Set DB_ADMIN_URL (see packages/db-tools/.env.example)')
  return url
}

/** A connection string for one login role, on the same server as the admin URL. */
export function roleUrl(role: string): string {
  const password = process.env[`${role.toUpperCase()}_DB_PASSWORD`]
  if (!password) throw new Error(`Set ${role.toUpperCase()}_DB_PASSWORD (see infra/compose/.env.example)`)
  const url = new URL(adminUrl())
  url.username = role
  url.password = password
  return url.toString()
}

export async function connect(url: string): Promise<Client> {
  const client = new Client({ connectionString: url })
  await client.connect()
  return client
}

/** The SQLSTATE of a failed query, or undefined when it succeeded. */
export async function sqlState(client: Client, text: string): Promise<string | undefined> {
  try {
    await client.query(text)
    return undefined
  } catch (err) {
    const code = typeof err === 'object' && err !== null && 'code' in err ? err.code : undefined
    return typeof code === 'string' ? code : 'unknown'
  }
}
