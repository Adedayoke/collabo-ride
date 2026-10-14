// The 4 point spacing grid, plus the fixed sizes components share. Layouts use `gap`.

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const

export type SpacingToken = keyof typeof spacing

/** Screen edge padding. */
export const screenPadding = spacing.lg

export const size = {
  /** Minimum touch target, above the 44 point minimum, matching Android's 48 dp. */
  touchTarget: 48,
  button: { sm: 40, md: 48, lg: 56 },
  icon: { sm: 16, md: 20, lg: 24, xl: 32 },
  avatar: { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 },
  /** Max content width on tablets (native) and in the console. */
  contentMaxWidth: { native: 640, console: 1280 },
  dialogMaxWidth: 420,
  focusRing: { width: 2, offset: 2 },
} as const

export const zIndex = {
  base: 0,
  sticky: 10,
  mapControls: 20,
  sheet: 30,
  toast: 40,
  dialog: 50,
} as const

/** Bottom sheet snap points. `collapsed` fits just the main action, so it is measured, not a fraction. */
export const sheetSnap = {
  half: 0.5,
  full: 0.9,
} as const

export const toastDuration = {
  default: 4000,
  withAction: 6000,
} as const
