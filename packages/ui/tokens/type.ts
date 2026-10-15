// The type ramp. Sizes scale with the system text size; components pick a step by name and
// the font family comes from the locale's font set in `fonts.ts`, never from a literal.

export const fontWeights = [400, 500, 600, 700] as const
export type FontWeight = (typeof fontWeights)[number]

export type TypeStep = {
  readonly size: number
  readonly lineHeight: number
  readonly weight: FontWeight
  /** Tabular figures, so prices and times don't shift as digits change. */
  readonly tabular: boolean
}

export const type = {
  display: { size: 34, lineHeight: 40, weight: 700, tabular: false },
  title1: { size: 28, lineHeight: 34, weight: 700, tabular: false },
  title2: { size: 22, lineHeight: 28, weight: 600, tabular: false },
  title3: { size: 20, lineHeight: 26, weight: 600, tabular: false },
  headline: { size: 17, lineHeight: 22, weight: 600, tabular: false },
  body: { size: 17, lineHeight: 24, weight: 400, tabular: false },
  callout: { size: 16, lineHeight: 22, weight: 400, tabular: false },
  subhead: { size: 15, lineHeight: 20, weight: 500, tabular: false },
  footnote: { size: 13, lineHeight: 18, weight: 400, tabular: false },
  caption: { size: 12, lineHeight: 16, weight: 500, tabular: false },
  price: { size: 28, lineHeight: 34, weight: 700, tabular: true },
  priceSm: { size: 17, lineHeight: 22, weight: 600, tabular: true },
} as const satisfies Record<string, TypeStep>

export type TypeToken = keyof typeof type

/** Caps on system text scaling. Everything else scales without limit. */
export const maxFontScale = {
  /** Map overlays and the tab bar, so the map stays usable. */
  mapOverlay: 1.3,
  tabBar: 1.3,
  /** `PinDisplay` and the `price` step. */
  pin: 1.5,
  price: 1.5,
} as const
