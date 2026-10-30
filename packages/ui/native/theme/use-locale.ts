import { matchLocale, productLocales, pseudoLocale, sourceLocale, useTranslation, type Locale } from '@collabo/i18n'

const known: readonly Locale[] = [...productLocales, pseudoLocale]

/** The active locale, for the number and date formatters in `@collabo/i18n`. */
export function useLocale(): Locale {
  const { i18n } = useTranslation()
  return matchLocale(i18n.language, known) ?? sourceLocale
}
