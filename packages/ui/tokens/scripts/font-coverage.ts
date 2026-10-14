// Reads each font file's character map and mark attachment, and decides per locale whether
// DM Sans covers it or the locale falls back to Inter (AC-6). `fonts.ts` is the written result;
// `fonts.test.ts` reruns this and fails when the two disagree.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import * as fontkit from 'fontkit'

export const fontsDir = join(import.meta.dirname, '..', '..', 'fonts')

export const fontSets = ['DMSans', 'Inter'] as const
export type FontSet = (typeof fontSets)[number]

const weights = [
  [400, 'Regular'],
  [500, 'Medium'],
  [600, 'SemiBold'],
  [700, 'Bold'],
] as const

export const coverageLocales = ['en', 'pcm', 'yo', 'ig', 'ha'] as const
export type CoverageLocale = (typeof coverageLocales)[number]

const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const punctuation = '.,:;!?\'"()[]{}-/&@#%+=*·•…‘’“”–—₦'

/** Characters each locale needs, written precomposed where Unicode has a precomposed form. */
const localeCharacters: Record<CoverageLocale, string> = {
  en: latin + punctuation,
  pcm: latin + punctuation,
  yo: latin + punctuation + 'ẸẹỌọṢṣÀÁÈÉÌÍÒÓÙÚàáèéìíòóùúŃńǸǹ',
  ig: latin + punctuation + 'ỊịỌọỤụṄṅÀÁÈÉÌÍÒÓÙÚàáèéìíòóùúŃńǸǹ',
  ha: latin + punctuation + 'ƁɓƊɗƘƙƳƴʼ',
}

/**
 * Sequences that only exist as a base letter plus a combining tone mark (dot below vowels
 * with a tone, syllabic m). The font must attach the mark instead of setting it apart.
 */
const localeMarkSequences: Record<CoverageLocale, readonly string[]> = {
  en: [],
  pcm: [],
  yo: ['ẹ́', 'ẹ̀', 'ọ́', 'ọ̀', 'Ẹ́', 'Ọ̀', 'ḿ', 'm̀', 'ẹ̄', 'ọ̄'],
  ig: ['ị́', 'ị̀', 'ọ́', 'ọ̀', 'ụ́', 'ụ̀', 'ṅ́', 'm̀', 'ị̄', 'ụ̄'],
  ha: [],
}

export type FontFile = {
  readonly set: FontSet
  readonly weight: (typeof weights)[number][0]
  /** The `fontFamily` name on Android and the web: the file name. */
  readonly token: string
  /** The `fontFamily` name on iOS, which uses the font's PostScript name. */
  readonly postscriptName: string
}

export type LocaleCoverage = {
  readonly missingCharacters: string
  readonly unattachedMarks: readonly string[]
}

export type FontAnalysis = {
  readonly files: readonly FontFile[]
  readonly coverage: Record<FontSet, Record<CoverageLocale, LocaleCoverage>>
  readonly localeFontSet: Record<CoverageLocale, FontSet>
}

function openFont(path: string): fontkit.Font {
  const font = fontkit.create(readFileSync(path))
  if (!('hasGlyphForCodePoint' in font)) {
    throw new Error(`${path} is a font collection; expected one static font per file`)
  }
  return font
}

/** True when shaping the sequence leaves every combining mark with no advance of its own. */
function attachesMark(font: fontkit.Font, sequence: string): boolean {
  const codePoints = [...sequence].map((character) => character.codePointAt(0) ?? 0)
  if (!codePoints.every((codePoint) => font.hasGlyphForCodePoint(codePoint))) return false
  const run = font.layout(sequence)
  // Either the shaper composed it into fewer glyphs, or each mark glyph sits on its base.
  if (run.glyphs.length < codePoints.length) return true
  return run.glyphs.every((glyph, index) => {
    const isMark = glyph.codePoints.some((codePoint) => codePoint >= 0x0300 && codePoint <= 0x036f)
    return !isMark || run.positions[index]?.xAdvance === 0
  })
}

function coverageOf(font: fontkit.Font, locale: CoverageLocale): LocaleCoverage {
  const missingCharacters = [...localeCharacters[locale]]
    .filter((character) => !font.hasGlyphForCodePoint(character.codePointAt(0) ?? 0))
    .join('')
  const unattachedMarks = localeMarkSequences[locale].filter((sequence) => !attachesMark(font, sequence))
  return { missingCharacters, unattachedMarks }
}

const covers = (coverage: LocaleCoverage) =>
  coverage.missingCharacters.length === 0 && coverage.unattachedMarks.length === 0

export function analyzeFonts(dir: string = fontsDir): FontAnalysis {
  const files: FontFile[] = []
  const fonts: Partial<Record<FontSet, fontkit.Font[]>> = {}
  for (const set of fontSets) {
    for (const [weight, name] of weights) {
      const token = `${set}_${weight}${name}`
      const font = openFont(join(dir, `${token}.ttf`))
      files.push({ set, weight, token, postscriptName: font.postscriptName })
      fonts[set] = [...(fonts[set] ?? []), font]
    }
  }

  const coverageFor = (set: FontSet) => {
    const result = {} as Record<CoverageLocale, LocaleCoverage>
    for (const locale of coverageLocales) {
      // A locale is covered only when every weight covers it.
      const perWeight = (fonts[set] ?? []).map((font) => coverageOf(font, locale))
      result[locale] = {
        missingCharacters: [...new Set(perWeight.flatMap((c) => [...c.missingCharacters]))].join(''),
        unattachedMarks: [...new Set(perWeight.flatMap((c) => c.unattachedMarks))],
      }
    }
    return result
  }

  const coverage = { DMSans: coverageFor('DMSans'), Inter: coverageFor('Inter') }
  const localeFontSet = {} as Record<CoverageLocale, FontSet>
  for (const locale of coverageLocales) {
    if (covers(coverage.DMSans[locale])) {
      localeFontSet[locale] = 'DMSans'
    } else if (covers(coverage.Inter[locale])) {
      localeFontSet[locale] = 'Inter'
    } else {
      throw new Error(`Neither DM Sans nor Inter covers ${locale}: ${JSON.stringify(coverage.Inter[locale])}`)
    }
  }

  return { files, coverage, localeFontSet }
}

export function renderFontsModule(analysis: FontAnalysis): string {
  const families = (set: FontSet) =>
    analysis.files
      .filter((file) => file.set === set)
      .map((file) => `    ${file.weight}: { token: '${file.token}', postscriptName: '${file.postscriptName}' },`)
      .join('\n')

  const coverage = (set: FontSet) =>
    coverageLocales
      .map((locale) => {
        const c = analysis.coverage[set][locale]
        const marks = c.unattachedMarks.map((m) => JSON.stringify(m)).join(', ')
        return `    ${locale}: { missingCharacters: ${JSON.stringify(c.missingCharacters)}, unattachedMarks: [${marks}] },`
      })
      .join('\n')

  const locales = coverageLocales.map((locale) => `  ${locale}: '${analysis.localeFontSet[locale]}',`).join('\n')

  return `// Generated by \`pnpm --filter @collabo/ui fonts:write\` from the files in \`packages/ui/fonts\`.
// Do not edit by hand: \`fonts.test.ts\` fails when this disagrees with the font files (AC-6).

import type { FontWeight } from './type.ts'

export type FontSet = 'DMSans' | 'Inter'

export type FontFace = {
  /** The \`fontFamily\` on Android and the web (the file name). */
  readonly token: string
  /** The \`fontFamily\` on iOS (the font's PostScript name). */
  readonly postscriptName: string
}

export const fontFamilies: Record<FontSet, Record<FontWeight, FontFace>> = {
  DMSans: {
${families('DMSans')}
  },
  Inter: {
${families('Inter')}
  },
}

/** What each font lacks per locale. A locale is set in DM Sans only when nothing is missing. */
export const fontCoverage = {
  DMSans: {
${coverage('DMSans')}
  },
  Inter: {
${coverage('Inter')}
  },
} as const

export const localeFontSet = {
${locales}
} as const satisfies Record<string, FontSet>

/** The font set for a locale tag such as \`yo\` or \`yo-NG\`; unknown locales use DM Sans. */
export function fontSetForLocale(locale: string): FontSet {
  const language = locale.split('-')[0] ?? locale
  return language in localeFontSet ? localeFontSet[language as keyof typeof localeFontSet] : 'DMSans'
}
`
}
