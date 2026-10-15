// WCAG 2.2 contrast math for opaque hex colors.

/** The minimum ratio each kind of pair must reach. */
export const contrastMinimum = {
  /** Body and label text. */
  text: 4.5,
  /** Text at 18pt, or 14pt bold, and up. */
  largeText: 3,
  /** Icons, input borders, focus rings, map markers. */
  nonText: 3,
} as const

export type ContrastKind = keyof typeof contrastMinimum

function channel(hex: string, offset: number): number {
  const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) {
    throw new Error(`Contrast needs an opaque #RRGGBB color, got ${hex}`)
  }
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5)
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
