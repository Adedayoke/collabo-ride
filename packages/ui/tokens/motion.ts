// Motion tokens. Every animation reads these; Reduce Motion turns the expressive moments
// into a fade no longer than `reducedFade`.

export const duration = {
  fast: 150,
  base: 220,
  slow: 320,
  /** The ceiling for any expressive moment. */
  expressiveMax: 900,
  /** The fade every moment becomes under Reduce Motion. */
  reducedFade: 150,
} as const

export const spring = {
  gentle: { damping: 20, stiffness: 180 },
  snappy: { damping: 18, stiffness: 260 },
} as const

/** cubic-bezier(0.2, 0, 0, 1) */
export const easeOut = [0.2, 0, 0, 1] as const

export type DurationToken = keyof typeof duration
export type SpringToken = keyof typeof spring
