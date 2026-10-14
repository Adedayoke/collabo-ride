// `@collabo/i18n`: every user facing string and formatter. Apps never import i18next directly.

export { I18nextProvider, Trans, useTranslation } from 'react-i18next'

export { catalogProblems, flatten, messageShape, surfaces } from './catalog.ts'
export type { Catalog, Surface } from './catalog.ts'
export {
  etaMinutes,
  formatDate,
  formatDistanceKm,
  formatMoney,
  formatMoneyAmount,
  formatNigerianPhone,
  formatRating,
  formatShortName,
  formatTime,
  initials,
  nairaToKobo,
} from './format.ts'
export { availableLocales, createI18n, errorKey, sourceCatalogs } from './i18n.ts'
export type { CreateI18nOptions } from './i18n.ts'
export {
  intlFallbackLocale,
  intlLocale,
  matchLocale,
  productLocales,
  pseudoLocale,
  resolveLocale,
  sourceLocale,
} from './locale.ts'
export type { Locale, LocaleSources, ProductLocale } from './locale.ts'
export { pseudoCatalog, pseudoMessage } from './pseudo.ts'
