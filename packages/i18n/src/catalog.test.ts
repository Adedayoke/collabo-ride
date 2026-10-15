import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { catalogProblems, surfaces, type Catalog } from './catalog.ts'
import { sourceCatalogs } from './i18n.ts'

const catalogsDir = join(import.meta.dirname, '..', 'catalogs')
const isCatalog = (value: unknown): value is Catalog => typeof value === 'object' && value !== null

function readCatalog(locale: string, surface: string): Catalog {
  const parsed: unknown = JSON.parse(readFileSync(join(catalogsDir, locale, `${surface}.json`), 'utf8'))
  if (!isCatalog(parsed)) throw new Error(`${locale}/${surface}.json is not an object`)
  return parsed
}

describe('catalog parity', () => {
  const locales = readdirSync(catalogsDir).filter((name) => name !== 'en')

  for (const surface of surfaces) {
    it(`en/${surface}.json is valid ICU with complete plurals`, () => {
      expect(catalogProblems(sourceCatalogs[surface], sourceCatalogs[surface], 'en')).toEqual([])
    })

    for (const locale of locales) {
      it(`${locale}/${surface}.json matches en`, () => {
        expect(catalogProblems(sourceCatalogs[surface], readCatalog(locale, surface), locale)).toEqual([])
      })
    }
  }
})

describe('catalogProblems', () => {
  const source = { trips: '{count, plural, one {# trip} other {# trips}}', hello: 'Hello {name}' }

  it('reports missing keys, extra keys, and changed placeholders', () => {
    expect(catalogProblems(source, { trips: source.trips, bye: 'Bye' }, 'en')).toEqual([
      'hello: missing',
      'bye: not in the source catalog',
    ])
    expect(catalogProblems(source, { ...source, hello: 'Hello {person}' }, 'en')).toEqual([
      'hello: placeholders {person}, expected {name}',
    ])
  })

  it('asks only for the plural categories the language needs', () => {
    expect(catalogProblems(source, { ...source, trips: '{count, plural, other {# irin ajo}}' }, 'yo')).toEqual([])
    expect(catalogProblems(source, { ...source, trips: '{count, plural, other {# trips}}' }, 'en')).toEqual([
      'trips: plural {count} lacks one for en',
    ])
  })
})
