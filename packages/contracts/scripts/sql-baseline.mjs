// Writes the shared SQL in packages/contracts/sql into each service's first
// migration, in that service's own tool (spec 0010, Build plan 1 and 2):
//   TS (Drizzle Kit): services/<svc>/drizzle/0000_baseline.sql
//   Go (goose):       services/dispatch/migrations/00001_baseline.sql
//   Python (Alembic): services/fraud/alembic/versions/0001_baseline.py
// A migration is a frozen snapshot, so the copies are real files. `--check`
// fails when a copy no longer matches the shared SQL.
//   node scripts/sql-baseline.mjs [--check]
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const contractsDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(contractsDir, '../..')

// Order matters: the trigger function first, then the tables.
const PARTS = ['set_updated_at.sql', 'outbox.sql', 'processed_events.sql', 'status_history.sql']

const HEADER = `-- Shared baseline from packages/contracts/sql (spec 0010).
-- Written by packages/contracts/scripts/sql-baseline.mjs. Do not edit: this
-- migration is applied once, and later changes go in a new migration.
`

export function baselineSql() {
  const body = PARTS.map((p) => readFileSync(join(contractsDir, 'sql', p), 'utf8').trimEnd()).join('\n\n')
  return `${HEADER}\n${body}\n`
}

function goose(sqlText) {
  return `-- +goose Up\n-- +goose StatementBegin\n${sqlText}-- +goose StatementEnd\n`
}

function alembic(sqlText) {
  return `"""Shared baseline from packages/contracts/sql (spec 0010).

Written by packages/contracts/scripts/sql-baseline.mjs. Do not edit.

Revision ID: 0001
Revises:
"""

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

BASELINE = r"""
${sqlText}"""


def upgrade() -> None:
    op.get_bind().exec_driver_sql(BASELINE)


def downgrade() -> None:
    raise NotImplementedError("Migrations are additive only (spec 0010, AC-7)")
`
}

export function targets() {
  const sqlText = baselineSql()
  const drizzle = ['accounts', 'trip', 'payments', 'notifications'].map((svc) => ({
    path: join(repoRoot, 'services', svc, 'drizzle', '0000_baseline.sql'),
    content: sqlText,
  }))
  return [
    ...drizzle,
    { path: join(repoRoot, 'services', 'dispatch', 'migrations', '00001_baseline.sql'), content: goose(sqlText) },
    { path: join(repoRoot, 'services', 'fraud', 'alembic', 'versions', '0001_baseline.py'), content: alembic(sqlText) },
  ]
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check')
  const stale = []
  for (const { path, content } of targets()) {
    if (check) {
      let current = ''
      try {
        current = readFileSync(path, 'utf8')
      } catch {
        current = ''
      }
      if (current !== content) stale.push(path)
    } else {
      writeFileSync(path, content)
    }
  }
  if (stale.length > 0) {
    console.error(`Baseline migrations differ from packages/contracts/sql:\n${stale.join('\n')}`)
    process.exit(1)
  }
}
