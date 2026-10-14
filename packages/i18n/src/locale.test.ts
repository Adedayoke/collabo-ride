import { describe, expect, it } from 'vitest'

import { intlFallbackLocale, intlLocale, matchLocale, productLocales, resolveLocale } from './locale.ts'

const available = ['en', 'en-XA'] as const

describe('resolveLocale', () => {
  it('prefers users.locale once signed in', () => {
    expect(resolveLocale({ userLocale: 'en', savedLocale: 'en-XA', deviceLocales: ['en-XA'], available })).toBe('en')
  })

  it('falls back to the saved choice, then the device languages', () => {
    expect(resolveLocale({ userLocale: null, savedLocale: 'en-XA', deviceLocales: ['en-GB'], available })).toBe('en-XA')
    expect(resolveLocale({ deviceLocales: ['fr-FR', 'en-GB'], available })).toBe('en')
  })

  it('ignores a locale with no catalog yet and ends at en', () => {
    expect(resolveLocale({ userLocale: 'yo', deviceLocales: ['ha-NG', 'fr'], available })).toBe('en')
  })

  it('takes a language with a catalog from any region tag', () => {
    expect(matchLocale('yo_NG', ['en', 'yo'])).toBe('yo')
    expect(matchLocale('EN-us', ['en'])).toBe('en')
  })
})

describe('intlLocale fallback table', () => {
  for (const locale of productLocales) {
    it(`formats ${locale} as en-NG when the runtime lacks its data`, () => {
      expect(intlLocale(locale, () => false)).toBe(intlFallbackLocale)
    })

    it(`uses the Nigerian ${locale} tag when the runtime has it`, () => {
      expect(intlLocale(locale, () => true)).toBe(`${locale}-NG`)
    })
  }
})
