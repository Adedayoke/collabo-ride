// Catalog shape and the parity check every locale must pass against `en`: the same keys, the
// same placeholders, and every plural category its language needs (CLDR, via Intl.PluralRules).

import {
  isArgumentElement,
  isNumberElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
  parse,
  type MessageFormatElement,
} from '@formatjs/icu-messageformat-parser'

export type Catalog = { [key: string]: string | Catalog }

export const surfaces = ['common', 'rider', 'driver', 'console'] as const
export type Surface = (typeof surfaces)[number]

/** `{ trip: { status: { arriving: '…' } } }` → `{ 'trip.status.arriving': '…' }` */
export function flatten(catalog: Catalog, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(catalog)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') result[path] = value
    else Object.assign(result, flatten(value, path))
  }
  return result
}

type MessageShape = {
  readonly placeholders: ReadonlySet<string>
  /** Plural argument name → the categories its branches name (exact `=N` matches left out). */
  readonly plurals: ReadonlyMap<string, ReadonlySet<string>>
}

function walk(
  elements: MessageFormatElement[],
  shape: { placeholders: Set<string>; plurals: Map<string, Set<string>> },
) {
  for (const element of elements) {
    if (isArgumentElement(element) || isNumberElement(element)) {
      shape.placeholders.add(element.value)
    } else if (isPluralElement(element)) {
      shape.placeholders.add(element.value)
      const categories = shape.plurals.get(element.value) ?? new Set<string>()
      for (const [selector, option] of Object.entries(element.options)) {
        if (!selector.startsWith('=')) categories.add(selector)
        walk(option.value, shape)
      }
      shape.plurals.set(element.value, categories)
    } else if (isSelectElement(element)) {
      shape.placeholders.add(element.value)
      for (const option of Object.values(element.options)) walk(option.value, shape)
    } else if (isTagElement(element)) {
      walk(element.children, shape)
    }
  }
}

export function messageShape(message: string): MessageShape {
  const shape = { placeholders: new Set<string>(), plurals: new Map<string, Set<string>>() }
  walk(parse(message, { ignoreTag: true }), shape)
  return shape
}

const sorted = (values: Iterable<string>) => [...values].toSorted().join(', ')

/** Every problem with `target` measured against the source catalog; empty when it matches. */
export function catalogProblems(source: Catalog, target: Catalog, locale: string): string[] {
  const problems: string[] = []
  const sourceMessages = flatten(source)
  const targetMessages = flatten(target)
  const needed = new Intl.PluralRules(locale).resolvedOptions().pluralCategories

  for (const key of Object.keys(sourceMessages)) {
    if (!(key in targetMessages)) problems.push(`${key}: missing`)
  }
  for (const [key, message] of Object.entries(targetMessages)) {
    const sourceMessage = sourceMessages[key]
    if (sourceMessage === undefined) {
      problems.push(`${key}: not in the source catalog`)
      continue
    }
    let shape: MessageShape
    try {
      shape = messageShape(message)
    } catch (error) {
      problems.push(`${key}: invalid ICU (${error instanceof Error ? error.message : String(error)})`)
      continue
    }
    const expected = messageShape(sourceMessage)
    if (sorted(shape.placeholders) !== sorted(expected.placeholders)) {
      problems.push(`${key}: placeholders {${sorted(shape.placeholders)}}, expected {${sorted(expected.placeholders)}}`)
    }
    for (const [argument, categories] of shape.plurals) {
      const missing = needed.filter((category) => !categories.has(category))
      if (missing.length > 0) problems.push(`${key}: plural {${argument}} lacks ${missing.join(', ')} for ${locale}`)
    }
  }
  return problems
}
