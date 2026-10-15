// What `PriceInput` keeps from typing: whole naira only, as integer kobo. Pure, so unit tested.

import { nairaToKobo } from '@collabo/i18n'

/** Enough for any fare; stops a pasted number from overflowing. */
const maxDigits = 7

/** The typed text as integer kobo, or null when nothing is typed. Kobo and separators are dropped. */
export function parseNairaInput(text: string): number | null {
  const digits =
    text
      .split('.')[0]
      ?.replace(/\D/g, '')
      .replace(/^0+(?=\d)/, '') ?? ''
  if (digits === '') return null
  return nairaToKobo(Number(digits.slice(0, maxDigits)))
}

/** Steps the price by `stepKobo`, never below zero, snapped to whole naira. */
export function stepPrice(valueKobo: number, stepKobo: number, direction: 1 | -1): number {
  const next = valueKobo + direction * stepKobo
  return Math.max(0, Math.round(next / 100) * 100)
}
