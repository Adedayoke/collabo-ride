// The console's translations: the saved locale, else the browser languages, else `en`.
// The pseudo locale `en-XA` is offered in development builds only.

import { availableLocales, createI18n, resolveLocale } from '@collabo/i18n'

const storageKey = 'collabo.locale'

function savedLocale(): string | null {
  try {
    return window.localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

const locale = resolveLocale({
  savedLocale: savedLocale(),
  deviceLocales: navigator.languages,
  available: availableLocales(import.meta.env.DEV),
})

export const i18n = createI18n({ surface: 'console', locale, pseudo: import.meta.env.DEV })

function applyLocale(language: string): void {
  // `tokens.css` switches the font stack by :lang, so <html lang> must follow the locale.
  document.documentElement.lang = language
  try {
    window.localStorage.setItem(storageKey, language)
  } catch {
    // Blocked storage: the choice lasts until reload.
  }
}

applyLocale(locale)
i18n.on('languageChanged', applyLocale)
