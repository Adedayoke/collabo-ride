// Runs `css-drift` on the CSS fixtures and expects exactly the findings their
// `expect: css-drift` comments name, then runs the CLI the way the `lint:css` script does.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { checkCss } from './css-drift.ts'

const fixturesDir = join(import.meta.dirname, 'fixtures')
const read = (file: string) => readFileSync(join(fixturesDir, file), 'utf8')

/** Lines whose trailing comment says `expect: css-drift`. */
function expectedLines(file: string): number[] {
  return read(file)
    .split('\n')
    .flatMap((line, index) => (/\/\*\s*expect:\s*css-drift\s*\*\//.test(line) ? [index + 1] : []))
}

describe('css-drift on the fixtures', () => {
  it('reports exactly the expected lines in bad.module.css', () => {
    const lines = checkCss(read('bad.module.css'), 'bad.module.css').map((finding) => finding.line)
    expect(lines.toSorted((a, b) => a - b)).toEqual(expectedLines('bad.module.css'))
  })

  it('reports nothing in good.module.css', () => {
    expect(checkCss(read('good.module.css'), 'good.module.css')).toEqual([])
  })

  it('has cases to find, so an empty run cannot pass', () => {
    expect(expectedLines('bad.module.css').length).toBeGreaterThan(10)
  })

  it('prints file:line findings and exits 1 from the command line', () => {
    let status = 0
    let output = ''
    try {
      execFileSync(process.execPath, [join(import.meta.dirname, 'css-drift.ts'), 'lint/fixtures/*.module.css'], {
        cwd: join(import.meta.dirname, '..'),
        encoding: 'utf8',
      })
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'status' in error && 'stdout' in error) {
        status = typeof error.status === 'number' ? error.status : 0
        output = typeof error.stdout === 'string' ? error.stdout : ''
      }
    }
    expect(status).toBe(1)
    const printed = output.trim().split('\n')
    expect(printed).toHaveLength(expectedLines('bad.module.css').length)
    expect(printed[0]).toMatch(/^lint\/fixtures\/bad\.module\.css:3: /)
  })
})
