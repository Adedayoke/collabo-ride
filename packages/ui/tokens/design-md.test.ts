// AC-1: every value `design.md` states matches `packages/ui/tokens`. Each value table in the
// guide is read back and compared to the tokens, both ways, so a changed token or a stale row
// fails here until the guide is updated.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { color } from './color.ts'
import { elevation } from './elevation.ts'
import { duration } from './motion.ts'
import { radius } from './radius.ts'
import { spacing } from './spacing.ts'
import { type } from './type.ts'

const guide = readFileSync(join(import.meta.dirname, '..', '..', '..', 'design.md'), 'utf8')

/** The body of one `## Heading` section, up to the next `## `. */
function section(heading: string): string {
  const start = guide.indexOf(`\n## ${heading}\n`)
  if (start < 0) throw new Error(`design.md has no "## ${heading}" section`)
  const end = guide.indexOf('\n## ', start + 1)
  return guide.slice(start, end < 0 ? undefined : end)
}

/** Table rows whose first cell is a backticked token name, as `name → [cells after it]`. */
function tokenRows(heading: string): Map<string, string[]> {
  const rows = new Map<string, string[]>()
  for (const line of section(heading).split('\n')) {
    const match = /^\|\s*`(\w+)`\s*\|(.*)\|\s*$/.exec(line)
    if (!match?.[1] || match[2] === undefined) continue
    rows.set(
      match[1],
      match[2].split('|').map((cell) => cell.trim().replaceAll('`', '')),
    )
  }
  return rows
}

describe('design.md matches the tokens (AC-1)', () => {
  it('lists every color with its light and dark value, and no others', () => {
    const rows = tokenRows('Color')
    expect([...rows.keys()].toSorted()).toEqual(Object.keys(color.light).toSorted())
    for (const [token, light] of Object.entries(color.light)) {
      const [listedLight, listedDark] = rows.get(token) ?? []
      const dark = Object.entries(color.dark).find(([name]) => name === token)?.[1]
      expect({ token, light: listedLight, dark: listedDark }).toEqual({ token, light, dark })
    }
  })

  it('lists every type step with its size, line height, weight, and figures', () => {
    const rows = tokenRows('Type')
    expect([...rows.keys()].toSorted()).toEqual(Object.keys(type).toSorted())
    for (const [token, step] of Object.entries(type)) {
      const [metrics, weight, tabular] = rows.get(token) ?? []
      expect({ token, metrics, weight, tabular }).toEqual({
        token,
        metrics: `${step.size} / ${step.lineHeight}`,
        weight: String(step.weight),
        tabular: step.tabular ? 'yes' : 'no',
      })
    }
  })

  for (const [heading, scale] of [
    ['Spacing', spacing],
    ['Radius', radius],
  ] as const) {
    it(`lists every ${heading.toLowerCase()} value`, () => {
      const rows = tokenRows(heading)
      expect(Object.fromEntries([...rows].map(([token, [value]]) => [token, Number(value)]))).toEqual(scale)
    })
  }

  it('lists every elevation in both modes', () => {
    const rows = tokenRows('Elevation')
    expect([...rows.keys()].toSorted()).toEqual(Object.keys(elevation.light).toSorted())
    for (const [token, light] of Object.entries(elevation.light)) {
      const [listedLight, listedDark] = rows.get(token) ?? []
      const dark = Object.entries(elevation.dark).find(([name]) => name === token)?.[1]
      expect({ token, light: listedLight, dark: listedDark }).toEqual({ token, light, dark })
    }
  })

  it('lists every motion duration', () => {
    const rows = tokenRows('Motion')
    expect(Object.fromEntries([...rows].map(([token, [value]]) => [token, value]))).toEqual(
      Object.fromEntries(Object.entries(duration).map(([token, ms]) => [token, `${ms} ms`])),
    )
  })
})
