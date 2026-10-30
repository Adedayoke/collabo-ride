import { describe, expect, it } from 'vitest'

import {
  etaMinutes,
  formatDistanceKm,
  formatMoney,
  formatMoneyAmount,
  formatNigerianPhone,
  formatRating,
  formatShortName,
  initials,
  nairaToKobo,
} from './format.ts'

describe('formatMoney (AC-7)', () => {
  it('shows 0 kobo as ₦0', () => {
    expect(formatMoney(0)).toBe('₦0')
  })

  it('drops the kobo part when it is 0', () => {
    expect(formatMoney(150000)).toBe('₦1,500')
  })

  it('keeps two decimals when there are kobo', () => {
    expect(formatMoney(125050)).toBe('₦1,250.50')
    expect(formatMoney(5)).toBe('₦0.05')
  })

  it('puts the minus before the symbol', () => {
    expect(formatMoney(-40000)).toBe('-₦400')
    expect(formatMoney(-125050)).toBe('-₦1,250.50')
  })

  it('groups large values', () => {
    expect(formatMoney(123456789000)).toBe('₦1,234,567,890')
    expect(formatMoney(Number.MAX_SAFE_INTEGER)).toBe('₦90,071,992,547,409.91')
  })

  it('rejects fractional kobo and unsafe integers', () => {
    expect(() => formatMoney(1.5)).toThrow(RangeError)
    expect(() => formatMoney(Number.MAX_SAFE_INTEGER + 2)).toThrow(RangeError)
    expect(() => formatMoney(Number.NaN)).toThrow(RangeError)
  })

  it('gives the bare amount for spoken text', () => {
    expect(formatMoneyAmount(150000)).toBe('1,500')
  })
})

describe('nairaToKobo', () => {
  it('multiplies whole naira by 100', () => {
    expect(nairaToKobo(1500)).toBe(150000)
  })

  it('rejects fractions', () => {
    expect(() => nairaToKobo(1.5)).toThrow(RangeError)
  })
})

describe('number formats', () => {
  it('keeps one decimal on ratings', () => {
    expect(formatRating(4.8, 'en')).toBe('4.8')
    expect(formatRating(5, 'en')).toBe('5.0')
  })

  it('uses one decimal under 10 km and whole km above', () => {
    expect(formatDistanceKm(3.44, 'en')).toBe('3.4 km')
    expect(formatDistanceKm(12.6, 'en')).toBe('13 km')
  })

  it('rounds ETAs up to whole minutes', () => {
    expect(etaMinutes(61)).toBe(2)
    expect(etaMinutes(0)).toBe(0)
    expect(etaMinutes(-5)).toBe(0)
  })
})

describe('names and phones', () => {
  it('shows a Nigerian mobile the local way', () => {
    expect(formatNigerianPhone('+2348031234567')).toBe('0803 123 4567')
    expect(formatNigerianPhone('+447700900123')).toBe('+447700900123')
  })

  it('shortens names to first name plus last initial', () => {
    expect(formatShortName('Tunde Adebayo')).toBe('Tunde A.')
    expect(formatShortName('  Chiamaka   Grace  Obi ')).toBe('Chiamaka O.')
    expect(formatShortName('Musa')).toBe('Musa')
    expect(formatShortName('')).toBe('')
  })

  it('takes initials from up to two words', () => {
    expect(initials('Ngozi Okafor')).toBe('NO')
    expect(initials('ọlá ayọ̀ bánkọ́lé')).toBe('ỌA')
    expect(initials('Musa')).toBe('M')
  })
})
