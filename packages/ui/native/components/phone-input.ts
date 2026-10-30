// Turns what someone types or pastes into a Nigerian mobile number: the national digits shown
// after a fixed +234 prefix, grouped 3 3 4 as they type, and E.164 once it is complete.
// Pure, so it is unit tested without React Native.

export type PhoneInput = {
  /** Up to 10 national digits, without the trunk 0 or country code. */
  readonly digits: string
  /** The digits grouped for display: `803 123 4567`. */
  readonly display: string
  /** `+2348031234567` once the number is complete and plausible, else null. */
  readonly e164: string | null
}

const nationalLength = 10

export function parsePhoneInput(raw: string): PhoneInput {
  let digits = raw.replace(/\D/g, '')
  // A pasted +234 / 234 number, or a local number with its trunk 0.
  if (digits.startsWith('234') && digits.length > nationalLength) digits = digits.slice(3)
  if (digits.startsWith('0')) digits = digits.slice(1)
  digits = digits.slice(0, nationalLength)

  const display = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)].filter(Boolean).join(' ')
  // Nigerian mobile numbers start 7, 8, or 9 after the trunk 0.
  const complete = digits.length === nationalLength && /^[789]/.test(digits)
  return { digits, display, e164: complete ? `+234${digits}` : null }
}

/** The display digits for a saved E.164 number, to prefill the field. */
export function phoneInputFromE164(e164: string | null | undefined): PhoneInput {
  return parsePhoneInput(e164 ?? '')
}
