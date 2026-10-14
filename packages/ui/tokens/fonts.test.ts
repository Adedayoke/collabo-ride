import { describe, expect, it } from 'vitest'

import { fontCoverage, fontFamilies, fontSetForLocale, localeFontSet } from './fonts.ts'
import { analyzeFonts } from './scripts/font-coverage.ts'

describe('fonts.ts matches the font files (AC-6)', () => {
  const analysis = analyzeFonts()

  it('records the coverage the files actually have', () => {
    expect(fontCoverage).toEqual(analysis.coverage)
  })

  it('records the font set each locale gets', () => {
    expect(localeFontSet).toEqual(analysis.localeFontSet)
  })

  it('records every file with its PostScript name', () => {
    for (const file of analysis.files) {
      expect(fontFamilies[file.set][file.weight]).toEqual({ token: file.token, postscriptName: file.postscriptName })
    }
  })
})

describe('the coverage check itself', () => {
  const { coverage } = analyzeFonts()

  it('checks the Yoruba dot below letters and their tone marks', () => {
    expect(coverage.Inter.yo).toEqual({ missingCharacters: '', unattachedMarks: [] })
  })

  it('checks the Hausa hooked letters', () => {
    expect(coverage.Inter.ha.missingCharacters).toBe('')
  })
})

describe('fontSetForLocale', () => {
  it('reads the language from a region tag', () => {
    expect(fontSetForLocale('ha-NG')).toBe(localeFontSet.ha)
  })

  it('uses DM Sans for an unknown locale', () => {
    expect(fontSetForLocale('fr')).toBe('DMSans')
  })
})
