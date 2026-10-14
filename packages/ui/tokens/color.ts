// Colors by role, never by hue. Every value is an explicit light and dark pair (spec 0012),
// so iOS, Android, and the console look the same. Read them through `useTheme()` (native)
// or the CSS variables in `tokens.css` (console), never by importing a mode directly.

export const colorModes = ['light', 'dark'] as const
export type ColorMode = (typeof colorModes)[number]

const light = {
  bg: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceSunken: '#F2F2EE',
  surfaceRaised: '#FFFFFF',
  border: '#E3E3DD',
  borderStrong: '#7A817C',
  text: '#161A17',
  textSecondary: '#5A615C',
  textTertiary: '#646B66',
  primary: '#1B5E3A',
  primaryPressed: '#154A2E',
  onPrimary: '#FFFFFF',
  primarySoft: '#E6F0EA',
  collabo: '#B45309',
  onCollabo: '#FFFFFF',
  collaboSoft: '#FDF1E3',
  collaboText: '#92400E',
  danger: '#B42318',
  onDanger: '#FFFFFF',
  dangerSoft: '#FDECEA',
  caution: '#8A6100',
  cautionSoft: '#FDF6D8',
  info: '#175CD3',
  infoSoft: '#EAF1FD',
  success: '#1B5E3A',
  focusRing: '#1B5E3A',
  scrim: 'rgba(15,20,18,0.48)',
  pressedOverlay: 'rgba(22,26,23,0.08)',
  disabledBg: '#ECECE7',
  disabledText: '#9AA09C',
  skeleton: '#ECECE7',
  skeletonHighlight: '#F6F6F2',
} as const

export type ColorToken = keyof typeof light
export type ColorPalette = Record<ColorToken, string>

const dark: ColorPalette = {
  bg: '#0F1412',
  surface: '#171D1A',
  surfaceSunken: '#121815',
  surfaceRaised: '#1F2622',
  border: '#2C3430',
  borderStrong: '#6E7772',
  text: '#EEF1EE',
  textSecondary: '#A9B1AC',
  textTertiary: '#8A928D',
  primary: '#4CAF7A',
  primaryPressed: '#3E9768',
  onPrimary: '#0B1F14',
  primarySoft: '#16301F',
  collabo: '#F5A524',
  onCollabo: '#2A1A05',
  collaboSoft: '#33230C',
  collaboText: '#F5A524',
  danger: '#F97066',
  onDanger: '#2B0A07',
  dangerSoft: '#3A1512',
  caution: '#FACC15',
  cautionSoft: '#332A07',
  info: '#7CB4FF',
  infoSoft: '#10233F',
  success: '#4CAF7A',
  focusRing: '#7FD1A3',
  scrim: 'rgba(0,0,0,0.6)',
  pressedOverlay: 'rgba(238,241,238,0.10)',
  disabledBg: '#232A26',
  disabledText: '#5F6863',
  skeleton: '#1F2622',
  skeletonHighlight: '#28302C',
}

export const color: Record<ColorMode, ColorPalette> = { light, dark }
