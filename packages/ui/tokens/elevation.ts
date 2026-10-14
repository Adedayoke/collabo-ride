import type { ColorMode } from './color.ts'

// Elevation as `boxShadow` strings. In dark mode surfaces step lighter instead, and the
// shadows darken at the same offsets.

export type ElevationToken = 'card' | 'raised' | 'overlay'

export const elevation: Record<ColorMode, Record<ElevationToken, string>> = {
  light: {
    card: '0 1px 2px rgba(22,26,23,0.06)',
    raised: '0 4px 12px rgba(22,26,23,0.10)',
    overlay: '0 12px 32px rgba(22,26,23,0.18)',
  },
  dark: {
    card: '0 1px 2px rgba(0,0,0,0.4)',
    raised: '0 4px 12px rgba(0,0,0,0.4)',
    overlay: '0 12px 32px rgba(0,0,0,0.4)',
  },
}

/** Hairline width on the web. Native uses `StyleSheet.hairlineWidth`. */
export const hairlineWeb = 1
