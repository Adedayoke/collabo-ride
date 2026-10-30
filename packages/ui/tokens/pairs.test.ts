import { describe, expect, it } from 'vitest'

import { color, colorModes } from './color.ts'
import { contrastMinimum, contrastRatio } from './contrast.ts'
import { pairs } from './pairs.ts'

describe('contrast pairs (AC-3)', () => {
  for (const mode of colorModes) {
    for (const pair of pairs) {
      const minimum = contrastMinimum[pair.kind]
      it(`${mode}: ${pair.fg} on ${pair.bg} reaches ${minimum}:1 (${pair.use})`, () => {
        const ratio = contrastRatio(color[mode][pair.fg], color[mode][pair.bg])
        expect(ratio).toBeGreaterThanOrEqual(minimum)
      })
    }
  }
})

describe('contrastRatio', () => {
  it('gives 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
  })

  it('fails the spec example: textTertiary at #8C938E on surfaceSunken', () => {
    expect(contrastRatio('#8C938E', color.light.surfaceSunken)).toBeLessThan(contrastMinimum.text)
  })

  it('rejects colors with alpha', () => {
    expect(() => contrastRatio('rgba(0,0,0,0.5)', '#FFFFFF')).toThrow()
  })
})
