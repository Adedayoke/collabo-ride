// Runs the real oxlint on the fixtures and expects exactly the diagnostics their
// `expect: <rule>` comments name, nothing missing and nothing extra. JS plugins are alpha in
// oxlint, so an oxlint bump that quietly stops a rule from reporting fails here first.

import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const configDir = join(import.meta.dirname, '..')
const repoRoot = join(configDir, '..', '..')
const fixturesDir = join(import.meta.dirname, 'fixtures')
// The fixture folder ignores its own files so lefthook and workspace lint skip them, so the
// test lints copies in a folder with a plain config instead.
const runDir = join(configDir, '.fixture-run')
const oxlintBin = join(dirname(createRequire(import.meta.url).resolve('oxlint/package.json')), 'bin', 'oxlint')

type Finding = `${string}:${number}`

/** `// expect: rule` trailing code expects that line; standing alone it expects the next line. */
function expectedFindings(file: string): Finding[] {
  const lines = readFileSync(join(fixturesDir, file), 'utf8').split('\n')
  return lines.flatMap((line, index): Finding[] => {
    const match = /(?:\/\/|\{?\/\*)\s*expect:\s*([\w-]+\/[\w-]+)/.exec(line)
    if (!match?.[1]) return []
    const standalone = /^\s*(?:\/\/|\{\/\*)/.test(line)
    return [`${match[1]}:${standalone ? index + 2 : index + 1}`]
  })
}

type Diagnostic = { code: string; filename: string; labels?: { span: { line: number } }[] }
type OxlintReport = { diagnostics: Diagnostic[] }

const isDiagnostic = (value: unknown): value is Diagnostic =>
  typeof value === 'object' &&
  value !== null &&
  'code' in value &&
  typeof value.code === 'string' &&
  'filename' in value &&
  typeof value.filename === 'string'

function parseReport(output: string): OxlintReport {
  const parsed: unknown = JSON.parse(output)
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('diagnostics' in parsed) ||
    !Array.isArray(parsed.diagnostics)
  ) {
    throw new Error(`Unexpected oxlint output: ${output.slice(0, 200)}`)
  }
  return { diagnostics: parsed.diagnostics.filter(isDiagnostic) }
}

function lint(cwd: string, args: string[]): OxlintReport {
  let output: string
  try {
    output = execFileSync(process.execPath, [oxlintBin, '--format', 'json', ...args], { cwd, encoding: 'utf8' })
  } catch (error) {
    // oxlint exits 1 when it finds anything; the JSON report is still on stdout.
    if (typeof error === 'object' && error !== null && 'stdout' in error && typeof error.stdout === 'string') {
      output = error.stdout
    } else {
      throw error
    }
  }
  return parseReport(output)
}

/** `collabo(no-untranslated-call)` → `collabo/no-untranslated-call:12` */
function findings(report: OxlintReport, file: string): Finding[] {
  return report.diagnostics
    .filter(
      (diagnostic) => diagnostic.filename.replaceAll('\\', '/').endsWith(`/${file}`) || diagnostic.filename === file,
    )
    .map((diagnostic): Finding => {
      const rule = diagnostic.code.replace(/^([\w-]+)\((.+)\)$/, '$1/$2')
      return `${rule}:${diagnostic.labels?.[0]?.span.line ?? 0}`
    })
}

const sorted = (values: Finding[]) => values.toSorted()

beforeAll(() => {
  rmSync(runDir, { recursive: true, force: true })
  mkdirSync(runDir)
  for (const file of ['bad.tsx', 'good.tsx']) cpSync(join(fixturesDir, file), join(runDir, file))
  writeFileSync(join(runDir, '.oxlintrc.json'), JSON.stringify({ extends: ['../oxlint.ui.json'] }))
})

afterAll(() => {
  rmSync(runDir, { recursive: true, force: true })
})

describe('collabo and i18next rules on the fixtures', () => {
  it('reports exactly the expected cases with an explicit config', () => {
    const report = lint(configDir, [
      '--config',
      join(runDir, '.oxlintrc.json'),
      join(runDir, 'bad.tsx'),
      join(runDir, 'good.tsx'),
    ])
    expect(sorted(findings(report, 'bad.tsx'))).toEqual(sorted(expectedFindings('bad.tsx')))
    expect(findings(report, 'good.tsx')).toEqual([])
  })

  it('reports the same from the repo root through the nested config chain, as lefthook runs it', () => {
    const report = lint(repoRoot, [
      relative(repoRoot, join(runDir, 'bad.tsx')),
      relative(repoRoot, join(runDir, 'good.tsx')),
    ])
    expect(sorted(findings(report, 'bad.tsx'))).toEqual(sorted(expectedFindings('bad.tsx')))
    expect(findings(report, 'good.tsx')).toEqual([])
  })

  it('finds at least one case per rule, so an empty run cannot pass', () => {
    const rules = new Set(expectedFindings('bad.tsx').map((finding) => finding.split(':')[0]))
    expect(rules).toEqual(new Set(['collabo/no-untranslated-call', 'i18next/no-literal-string']))
  })
})
