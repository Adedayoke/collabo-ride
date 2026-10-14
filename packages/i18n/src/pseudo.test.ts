import { describe, expect, it } from 'vitest'

import { messageShape } from './catalog.ts'
import { pseudoCatalog, pseudoMessage } from './pseudo.ts'

describe('pseudo locale en-XA', () => {
  it('accents, pads by 40%, and brackets the text', () => {
    expect(pseudoMessage('Close')).toBe('[Çļóšé~~]')
  })

  it('leaves placeholders and plural syntax untouched', () => {
    const source = '{count, plural, one {# trip} other {# trips}} to {place}'
    const pseudo = pseudoMessage(source)
    expect(pseudo).toContain('{count, plural, one {# ţŕíþ} other {# ţŕíþš}}')
    expect(pseudo).toContain('{place}')
    expect(messageShape(pseudo)).toEqual(messageShape(source))
  })

  it('treats an apostrophe inside a word as text', () => {
    expect(pseudoMessage("didn't")).toBe("[ðíðñ'ţ~~~]")
  })

  it('transforms nested catalogs', () => {
    expect(pseudoCatalog({ a: { b: 'Hi' } })).toEqual({ a: { b: '[Ĥí~]' } })
  })
})
