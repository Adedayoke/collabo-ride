import { describe, expect, it } from 'vitest'

import { parsePhoneInput, phoneInputFromE164 } from './phone-input.ts'

describe('parsePhoneInput', () => {
  it('groups digits 3 3 4 as they are typed', () => {
    expect(parsePhoneInput('8').display).toBe('8')
    expect(parsePhoneInput('8031').display).toBe('803 1')
    expect(parsePhoneInput('8031234').display).toBe('803 123 4')
    expect(parsePhoneInput('8031234567').display).toBe('803 123 4567')
  })

  it('drops the trunk 0 and a pasted country code', () => {
    expect(parsePhoneInput('08031234567').e164).toBe('+2348031234567')
    expect(parsePhoneInput('+234 803 123 4567').e164).toBe('+2348031234567')
    expect(parsePhoneInput('2348031234567').e164).toBe('+2348031234567')
  })

  it('stops at 10 national digits', () => {
    expect(parsePhoneInput('803123456789').digits).toBe('8031234567')
  })

  it('gives E.164 only for a complete mobile number', () => {
    expect(parsePhoneInput('803123456').e164).toBeNull()
    expect(parsePhoneInput('1031234567').e164).toBeNull()
    expect(parsePhoneInput('7031234567').e164).toBe('+2347031234567')
    expect(parsePhoneInput('9031234567').e164).toBe('+2349031234567')
  })

  it('ignores anything that is not a digit', () => {
    expect(parsePhoneInput('803-123-abc').digits).toBe('803123')
  })

  it('prefills from a saved number', () => {
    expect(phoneInputFromE164('+2348031234567').display).toBe('803 123 4567')
    expect(phoneInputFromE164(null).display).toBe('')
  })
})
