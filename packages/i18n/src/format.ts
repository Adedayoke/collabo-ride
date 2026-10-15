// Number, money, and name formatting. Money always arrives as integer kobo from the API.

import { intlLocale, type Locale } from './locale.ts'

const KOBO_PER_NAIRA = 100

function assertKobo(kobo: number): void {
  if (!Number.isSafeInteger(kobo)) {
    throw new RangeError(`Money must be a whole number of kobo, got ${kobo}`)
  }
}

const wholeNaira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
})

/**
 * `₦1,500` when the kobo part is 0, `₦1,250.50` otherwise, always with `en-NG` grouping (AC-7).
 * Negative amounts read `-₦400`. The naira and kobo parts are formatted apart, because
 * dividing a large kobo amount by 100 in floating point loses the last kobo.
 */
export function formatMoney(kobo: number): string {
  assertKobo(kobo)
  const magnitude = Math.abs(kobo)
  const naira = wholeNaira.format(Math.trunc(magnitude / KOBO_PER_NAIRA))
  const remainder = magnitude % KOBO_PER_NAIRA
  const amount = remainder === 0 ? naira : `${naira}.${String(remainder).padStart(2, '0')}`
  return kobo < 0 ? `-${amount}` : amount
}

/** The amount without the symbol, for screen reader text such as "1,500 naira". */
export function formatMoneyAmount(kobo: number): string {
  return formatMoney(kobo).replace('₦', '')
}

/** Whole naira to kobo, for price inputs that only take whole naira. */
export function nairaToKobo(naira: number): number {
  if (!Number.isSafeInteger(naira)) {
    throw new RangeError(`Whole naira expected, got ${naira}`)
  }
  return naira * KOBO_PER_NAIRA
}

/** Ratings keep one decimal: `4.8`, `5.0`. */
export function formatRating(rating: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
    rating,
  )
}

/** Kilometres with one decimal under 10 km (`3.4 km`), whole above (`12 km`). */
export function formatDistanceKm(km: number, locale: Locale): string {
  const digits = km < 10 ? 1 : 0
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'unit',
    unit: 'kilometer',
    unitDisplay: 'short',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(km)
}

/** Whole minutes, rounded up so "1 min" never means "already here". */
export function etaMinutes(seconds: number): number {
  return Math.max(0, Math.ceil(seconds / 60))
}

export function formatTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { hour: 'numeric', minute: '2-digit' }).format(date)
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

/** `+2348031234567` → `0803 123 4567`. Anything that isn't a Nigerian mobile comes back unchanged. */
export function formatNigerianPhone(e164: string): string {
  const match = /^\+234(\d{3})(\d{3})(\d{4})$/.exec(e164)
  return match ? `0${match[1]} ${match[2]} ${match[3]}` : e164
}

const words = (name: string) => name.trim().split(/\s+/).filter(Boolean)

/** "Tunde Adebayo" → "Tunde A."; a one word name stays as it is. */
export function formatShortName(fullName: string): string {
  const [first, ...rest] = words(fullName)
  const last = rest.at(-1)
  if (!first) return ''
  return last ? `${first} ${last.charAt(0).toLocaleUpperCase()}.` : first
}

/** Avatar initials from up to two words: "Ngozi Okafor" → "NO". */
export function initials(fullName: string): string {
  return words(fullName)
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase())
    .join('')
}
