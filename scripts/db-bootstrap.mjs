// Applies the init scripts that are safe to run again (02 onward) to the
// running Postgres, so an existing data volume catches up without a wipe.
// 01-bootstrap.sql only runs on a fresh volume. Needs `pnpm infra:up`.
import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'

const compose = [
  'compose',
  '-f',
  'infra/compose/compose.yaml',
  '--env-file',
  'infra/compose/.env',
  '--profile',
  'infra',
]
const run = (args) => execFileSync('docker', [...compose, ...args], { stdio: 'inherit' })

// Recreates the container only if its environment changed (the volume stays).
run(['up', '-d', '--wait', 'postgres'])

const rerunnable = readdirSync('infra/compose/postgres-init')
  .filter((f) => f.endsWith('.sql') && !f.startsWith('01-'))
  .toSorted()
for (const file of rerunnable) {
  console.log(`applying ${file}`)
  run([
    'exec',
    '-T',
    'postgres',
    'sh',
    '-c',
    `psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/${file}`,
  ])
}
