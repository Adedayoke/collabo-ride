// The `en-XA` pseudo locale: every message accented, 40% longer, and bracketed, so hard coded
// strings (left plain) and clipped layouts stand out in development builds.

import type { Catalog } from './catalog.ts'

const plain = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const accented = 'áƀçðéƒĝĥíĵķļɱñóþǫŕšţúṽŵẋýžÁƁÇÐÉƑĜĤÍĴĶĻṀÑÓÞǪŔŠŢÚṼŴẊÝŽ'
const accents = new Map([...plain].map((character, index) => [character, [...accented][index] ?? character]))

const EXPANSION = 0.4
const PAD = '~'

/**
 * Accents message text but never ICU syntax. In ICU, text sits at even brace depth (0 outside
 * any argument, 2 inside a plural or select branch) and argument syntax at odd depth.
 * An apostrophe starts a literal quote only before ICU syntax (`'{'`), so "didn't" stays text.
 */
export function pseudoMessage(message: string): string {
  const characters = [...message]
  let depth = 0
  let quoted = false
  let textLength = 0
  let out = ''
  for (const [index, character] of characters.entries()) {
    const next = characters[index + 1] ?? ''
    if (character === "'" && (quoted || (next !== '' && '{}#|'.includes(next)))) {
      quoted = !quoted
      out += character
      continue
    }
    if (!quoted && character === '{') depth += 1
    else if (!quoted && character === '}') depth -= 1
    else if (depth % 2 === 0 && character !== '#') {
      textLength += 1
      out += accents.get(character) ?? character
      continue
    }
    out += character
  }
  return `[${out}${PAD.repeat(Math.ceil(textLength * EXPANSION))}]`
}

export function pseudoCatalog(catalog: Catalog): Catalog {
  const result: Catalog = {}
  for (const [key, value] of Object.entries(catalog)) {
    result[key] = typeof value === 'string' ? pseudoMessage(value) : pseudoCatalog(value)
  }
  return result
}
