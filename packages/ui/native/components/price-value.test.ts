import { describe, expect, it } from 'vitest'

import { parseNairaInput, stepPrice } from './price-value.ts'

describe('parseNairaInput', () => {
  it('reads whole naira as kobo', () => {
    expect(parseNairaInput('1500')).toBe(150000)
    expect(parseNairaInput('1,500')).toBe(150000)
    expect(parseNairaInput('₦2,000')).toBe(200000)
  })

  it('drops anything after a decimal point', () => {
    expect(parseNairaInput('1250.50')).toBe(125000)
  })

  it('reads empty input as nothing typed', () => {
    expect(parseNairaInput('')).toBeNull()
    expect(parseNairaInput('₦')).toBeNull()
  })

  it('keeps a typed zero and strips leading zeros', () => {
    expect(parseNairaInput('0')).toBe(0)
    expect(parseNairaInput('0450')).toBe(45000)
  })

  it('caps very long pastes', () => {
    expect(parseNairaInput('123456789012')).toBe(123456700)
  })
})

describe('stepPrice', () => {
  it('raises and lowers by the step', () => {
    expect(stepPrice(150000, 10000, 1)).toBe(160000)
    expect(stepPrice(150000, 10000, -1)).toBe(140000)
  })

  it('never goes below zero', () => {
    expect(stepPrice(5000, 10000, -1)).toBe(0)
  })
})
