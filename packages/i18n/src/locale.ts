// Which locale the user sees, and which Intl locale formats their numbers and dates.

/** Every language the product plans to speak. `en` is the source catalog. */
export const productLocales = ['en', 'pcm', 'yo', 'ha', 'ig'] as const
export type ProductLocale = (typeof productLocales)[number]

/** The development only pseudo locale: accented, 40% longer, bracketed. */
export const pseudoLocale = 'en-XA'

export type Locale = ProductLocale | typeof pseudoLocale

export const sourceLocale: ProductLocale = 'en'

const isProductLocale = (value: string): value is ProductLocale => (productLocales as readonly string[]).includes(value)

/** Maps any tag (`yo-NG`, `en_GB`, `EN`) to a product locale with a catalog, or undefined. */
export function matchLocale(tag: string, available: readonly Locale[]): Locale | undefined {
  const normalized = tag.replace('_', '-')
  if (normalized.toLowerCase() === pseudoLocale.toLowerCase() && available.includes(pseudoLocale)) {
    return pseudoLocale
  }
  const language = normalized.split('-')[0]?.toLowerCase() ?? ''
  return isProductLocale(language) && available.includes(language) ? language : undefined
}

export type LocaleSources = {
  /** `users.locale` once signed in (spec 0010). Wins over everything. */
  readonly userLocale?: string | null
  /** The language chosen on this device before sign in. */
  readonly savedLocale?: string | null
  /** The device's preferred languages, best first (from `expo-localization` or `navigator.languages`). */
  readonly deviceLocales: readonly string[]
  /** Locales that have a catalog in this build. */
  readonly available: readonly Locale[]
}

/** users.locale, else the saved device choice, else the device languages, else `en`. */
export function resolveLocale({ userLocale, savedLocale, deviceLocales, available }: LocaleSources): Locale {
  for (const candidate of [userLocale, savedLocale, ...deviceLocales]) {
    if (!candidate) continue
    const match = matchLocale(candidate, available)
    if (match) return match
  }
  return sourceLocale
}

/** Where Hermes or a browser lacks Intl data for a locale, format as Nigerian English. */
export const intlFallbackLocale = 'en-NG'

const intlLocaleTag: Record<Locale, string> = {
  en: 'en-NG',
  pcm: 'pcm-NG',
  yo: 'yo-NG',
  ha: 'ha-NG',
  ig: 'ig-NG',
  [pseudoLocale]: 'en-NG',
}

/**
 * The tag to hand `Intl` for a locale: its Nigerian form when the runtime has data for it,
 * else `en-NG`. Pass `supports` to test against a specific runtime.
 */
export function intlLocale(
  locale: Locale,
  supports: (tag: string) => boolean = (tag) => Intl.NumberFormat.supportedLocalesOf(tag).length > 0,
): string {
  const tag = intlLocaleTag[locale]
  return supports(tag) ? tag : intlFallbackLocale
}
