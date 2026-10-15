import { describe, expect, it } from 'vitest'

import { formatMoney } from './format.ts'
import { createI18n, errorKey } from './i18n.ts'

describe('createI18n', () => {
  it('formats ICU plurals and placeholders from the common catalog', () => {
    const i18n = createI18n({ surface: 'rider', locale: 'en', pseudo: false })
    expect(i18n.t('action.resendIn', { seconds: 1 })).toBe('Resend code in 1 second')
    expect(i18n.t('action.resendIn', { seconds: 30 })).toBe('Resend code in 30 seconds')
    expect(i18n.t('money.suggestedMinimum', { fare: formatMoney(150000) })).toBe('Suggested minimum ₦1,500')
  })

  it('reads the surface catalog by namespace', () => {
    const i18n = createI18n({ surface: 'driver', locale: 'en', pseudo: false })
    expect(i18n.t('home.title', { ns: 'driver' })).toBe('Ready to drive?')
  })

  it('serves the pseudo locale only when asked', () => {
    const i18n = createI18n({ surface: 'rider', locale: 'en-XA', pseudo: true })
    expect(i18n.t('action.close')).toBe('[Çļóšé~~]')
    expect(i18n.t('action.resendIn', { seconds: 2 })).toMatch(/^\[Ŕéšéñð çóðé íñ 2 šéçóñðš~+\]$/)

    const plain = createI18n({ surface: 'rider', locale: 'en-XA', pseudo: false })
    expect(plain.t('action.close')).toBe('Close')
  })
})

describe('errorKey', () => {
  it('maps a known API code to its catalog key', () => {
    expect(errorKey('BAD_REQUEST')).toBe('errors.BAD_REQUEST')
  })

  it('maps anything else to the general failure', () => {
    expect(errorKey('SOMETHING_NEW')).toBe('errors.UNKNOWN')
    expect(errorKey('toString')).toBe('errors.UNKNOWN')
  })
})
