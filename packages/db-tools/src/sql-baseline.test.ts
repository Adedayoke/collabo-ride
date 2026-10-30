// The shared baseline drift check (spec 0010, AC-3): every service's first
// migration is a frozen copy of packages/contracts/sql, and `--check` fails,
// naming each copy, once they differ. The edit case runs on a copy of the
// script in a temp folder, so the repo's own SQL is never touched.
import { spawnSync } from 'node:child_process'
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const contractsDir = fileURLToPath(new URL('../../contracts', import.meta.url))
const COPIES = [
  'services/accounts/drizzle/0000_baseline.sql',
  'services/trip/drizzle/0000_baseline.sql',
  'services/payments/drizzle/0000_baseline.sql',
  'services/notifications/drizzle/0000_baseline.sql',
  'services/dispatch/migrations/00001_baseline.sql',
  'services/fraud/alembic/versions/0001_baseline.py',
]

const run = (script: string, ...args: string[]) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })

describe('sql-baseline --check', () => {
  it('passes on the repo as committed', () => {
    const result = run(join(contractsDir, 'scripts', 'sql-baseline.mjs'), '--check')
    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
  })

  describe('in a copy of the repo layout', () => {
    let root = ''
    let script = ''

    beforeAll(() => {
      root = mkdtempSync(join(tmpdir(), 'sql-baseline-'))
      const contracts = join(root, 'packages', 'contracts')
      cpSync(join(contractsDir, 'scripts', 'sql-baseline.mjs'), join(contracts, 'scripts', 'sql-baseline.mjs'))
      cpSync(join(contractsDir, 'sql'), join(contracts, 'sql'), { recursive: true })
      for (const copy of COPIES) mkdirSync(join(root, copy, '..'), { recursive: true })
      script = join(contracts, 'scripts', 'sql-baseline.mjs')
    })

    afterAll(() => rmSync(root, { recursive: true, force: true }))

    it('fails naming every copy when none has been written', () => {
      const result = run(script, '--check')
      expect(result.status).toBe(1)
      for (const copy of COPIES) expect(result.stderr).toContain(join(root, copy))
    })

    it('passes once the copies are written', () => {
      expect(run(script).status).toBe(0)
      expect(run(script, '--check').status).toBe(0)
    })

    it('fails naming every copy after one shared SQL file changes', () => {
      expect(run(script).status).toBe(0)
      appendFileSync(join(root, 'packages', 'contracts', 'sql', 'outbox.sql'), '\n-- drift\n')
      const result = run(script, '--check')
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('Baseline migrations differ from packages/contracts/sql')
      for (const copy of COPIES) expect(result.stderr).toContain(join(root, copy))
    })
  })
})
