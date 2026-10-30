// The migration guard (spec 0010, AC-7): once a table exists, later features
// may only add to it. A new migration may not drop or rename a table or
// column, change a column's type, or add a NOT NULL column without a default.
// Widening a CHECK list is the one allowed drop: DROP CONSTRAINT then ADD
// CONSTRAINT with the same name, in a file marked `-- guard: widen-check`
// (that the new list keeps every old value is checked in review).

export interface GuardFinding {
  file: string
  line: number
  rule: string
  text: string
}

export const WIDEN_CHECK_MARKER = '-- guard: widen-check'

/** Where each tool keeps its migrations, relative to the repo root. */
export const MIGRATION_PATHS = [
  /^services\/[^/]+\/drizzle\/[^/]+\.sql$/,
  /^services\/dispatch\/migrations\/[^/]+\.sql$/,
  /^services\/fraud\/alembic\/versions\/[^/]+\.py$/,
]

export const isMigration = (path: string) => MIGRATION_PATHS.some((re) => re.test(path.replaceAll('\\', '/')))

interface Rule {
  rule: string
  pattern: RegExp
}

const SQL_RULES: Rule[] = [
  { rule: 'drop_table', pattern: /\bDROP\s+TABLE\b/i },
  { rule: 'drop_column', pattern: /\bDROP\s+COLUMN\b/i },
  { rule: 'rename', pattern: /\bRENAME\s+(COLUMN\b|TO\b|\w+\s+TO\b)/i },
  { rule: 'change_type', pattern: /\bALTER\s+COLUMN\s+\S+\s+(SET\s+DATA\s+)?TYPE\b/i },
  // drizzle-kit quotes types it does not know; Postgres rejects "geography(Point,4326)".
  { rule: 'quoted_geography', pattern: /"geography\(/i },
  // postgres-init creates every schema with its owner; drizzle-kit emits this for a new pgSchema.
  { rule: 'create_schema', pattern: /\bCREATE\s+SCHEMA\b/i },
]

const PY_RULES: Rule[] = [
  { rule: 'drop_table', pattern: /\bop\.drop_table\b/ },
  { rule: 'drop_column', pattern: /\bop\.drop_column\b/ },
  { rule: 'rename', pattern: /\bop\.rename_table\b|\bnew_column_name\s*=/ },
  { rule: 'change_type', pattern: /\bop\.alter_column\([^)]*\btype_\s*=/ },
]

/** The part of a migration that runs going forward (goose Down and Alembic downgrade are skipped). */
function forwardPart(path: string, text: string): string {
  if (path.endsWith('.py')) {
    const at = text.search(/^def downgrade\b/m)
    return at === -1 ? text : text.slice(0, at)
  }
  const at = text.search(/^--\s*\+goose\s+Down\b/im)
  return at === -1 ? text : text.slice(0, at)
}

/** Strips `--` comments so a comment never trips a rule. */
const withoutComments = (line: string) => line.replace(/--.*$/, '')

/**
 * `ADD COLUMN ... NOT NULL` with no DEFAULT. Statements are split on `;`, so a
 * multi line ADD COLUMN is read whole.
 */
function notNullWithoutDefault(statement: string): boolean {
  const adds = statement.split(/\bADD\s+COLUMN\b/i).slice(1)
  return adds.some((clause) => {
    const column = clause.split(/,\s*(?=ADD\b|ALTER\b|DROP\b)/i)[0] ?? ''
    return /\bNOT\s+NULL\b/i.test(column) && !/\bDEFAULT\b/i.test(column) && !/\bGENERATED\b/i.test(column)
  })
}

export function checkMigration(path: string, text: string): GuardFinding[] {
  const findings: GuardFinding[] = []
  const forward = forwardPart(path, text)
  const lines = forward.split(/\r?\n/)
  const rules = path.endsWith('.py') ? [...SQL_RULES, ...PY_RULES] : SQL_RULES

  lines.forEach((raw, index) => {
    const line = withoutComments(raw)
    for (const { rule, pattern } of rules) {
      if (pattern.test(line)) findings.push({ file: path, line: index + 1, rule, text: raw.trim() })
    }
  })

  // NOT NULL without a default, per statement.
  let offset = 0
  for (const statement of forward.split(';')) {
    const clean = statement.split(/\r?\n/).map(withoutComments).join('\n')
    if (notNullWithoutDefault(clean)) {
      const lead = statement.length - statement.trimStart().length
      const line = forward.slice(0, offset + lead).split(/\r?\n/).length
      findings.push({ file: path, line, rule: 'not_null_without_default', text: clean.trim().split('\n')[0] ?? '' })
    }
    offset += statement.length + 1
  }

  // DROP CONSTRAINT: only to widen a CHECK, re-added under the same name in this file.
  const marked = text.includes(WIDEN_CHECK_MARKER)
  const added = new Set([...forward.matchAll(/\bADD\s+CONSTRAINT\s+"?(\w+)"?/gi)].map((m) => m[1]?.toLowerCase()))
  lines.forEach((raw, index) => {
    const match = /\bDROP\s+CONSTRAINT\s+(?:IF\s+EXISTS\s+)?"?(\w+)"?/i.exec(withoutComments(raw))
    if (!match) return
    const name = match[1]?.toLowerCase()
    if (!marked) {
      findings.push({ file: path, line: index + 1, rule: 'drop_constraint', text: raw.trim() })
    } else if (!name || !added.has(name)) {
      findings.push({ file: path, line: index + 1, rule: 'widen_check_not_readded', text: raw.trim() })
    }
  })

  return findings.toSorted((a, b) => a.line - b.line)
}

export function formatFindings(findings: readonly GuardFinding[]): string {
  return findings.map((f) => `${f.file}:${f.line}  [${f.rule}] ${f.text}`).join('\n')
}
