// Corner radii. Non capsule radii pair with `borderCurve: 'continuous'` on native.

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const

export type RadiusToken = keyof typeof radius
