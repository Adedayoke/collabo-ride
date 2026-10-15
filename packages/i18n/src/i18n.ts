// One i18next instance per surface, ICU message syntax, `en` as source and fallback.

import { createInstance, type i18n as I18n } from 'i18next'
import ICU from 'i18next-icu'
import { initReactI18next } from 'react-i18next'

import common from '../catalogs/en/common.json'
import consoleCatalog from '../catalogs/en/console.json'
import driver from '../catalogs/en/driver.json'
import rider from '../catalogs/en/rider.json'
import type { Catalog, Surface } from './catalog.ts'
import { pseudoLocale, sourceLocale, type Locale } from './locale.ts'
import { pseudoCatalog } from './pseudo.ts'

export const sourceCatalogs = { common, rider, driver, console: consoleCatalog } satisfies Record<Surface, Catalog>

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: typeof sourceCatalogs
  }
}

/** Locales with a catalog in this build. The pseudo locale only when asked for (development). */
export function availableLocales(includePseudo: boolean): Locale[] {
  return includePseudo ? [sourceLocale, pseudoLocale] : [sourceLocale]
}

export type CreateI18nOptions = {
  readonly surface: Exclude<Surface, 'common'>
  readonly locale: Locale
  /** Builds the `en-XA` catalog. Pass true in development builds only. */
  readonly pseudo: boolean
}

export function createI18n({ surface, locale, pseudo }: CreateI18nOptions): I18n {
  const namespaces = { common: sourceCatalogs.common, [surface]: sourceCatalogs[surface] }
  const resources: Record<string, Record<string, Catalog>> = { [sourceLocale]: namespaces }
  if (pseudo) {
    resources[pseudoLocale] = Object.fromEntries(
      Object.entries(namespaces).map(([namespace, catalog]) => [namespace, pseudoCatalog(catalog)]),
    )
  }

  const instance = createInstance()
  void instance
    .use(ICU)
    .use(initReactI18next)
    .init({
      lng: locale,
      fallbackLng: sourceLocale,
      supportedLngs: availableLocales(pseudo),
      ns: ['common', surface],
      defaultNS: 'common',
      resources,
      initAsync: false,
      returnNull: false,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    })
  return instance
}

type ErrorCode = keyof typeof sourceCatalogs.common.errors

const isKnownErrorCode = (code: string): code is ErrorCode => Object.hasOwn(sourceCatalogs.common.errors, code)

/** The catalog key for an API error `code`; unknown codes read as a general failure. */
export function errorKey(code: string): `errors.${ErrorCode}` {
  return isKnownErrorCode(code) ? `errors.${code}` : 'errors.UNKNOWN'
}
