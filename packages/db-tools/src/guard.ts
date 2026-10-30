// `pnpm db:guard [files...]`: runs the migration guard (spec 0010, AC-7).
// With files (lefthook passes the staged ones), checks those. Without, checks
// every migration added or changed since this branch left the base branch
// (GUARD_BASE, default origin/main).
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { checkMigration, formatFindings, isMigration } from './migration-guard'

const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const root = git('rev-parse', '--show-toplevel')

function changedSinceBase(): string[] {
  const base = process.env.GUARD_BASE ?? 'origin/main'
  const mergeBase = git('merge-base', 'HEAD', base)
  const committed = git('diff', '--name-only', '--diff-filter=AM', mergeBase, 'HEAD')
  const staged = git('diff', '--name-only', '--diff-filter=AM', '--cached')
  return [...new Set([...committed.split('\n'), ...staged.split('\n')])].filter(Boolean)
}

const args = process.argv.slice(2)
const files = (args.length > 0 ? args.map((f) => relative(root, f)) : changedSinceBase())
  .map((f) => f.replaceAll('\\', '/'))
  .filter(isMigration)

const findings = files.flatMap((file) => checkMigration(file, readFileSync(join(root, file), 'utf8')))
if (findings.length > 0) {
  console.error(`Migrations may only add (spec 0010, AC-7):\n${formatFindings(findings)}`)
  process.exitCode = 1
} else {
  console.log(`Migration guard: ${files.length} migration file(s) checked, all additive.`)
}
