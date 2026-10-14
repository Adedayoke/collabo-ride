import type { ColorToken } from './color.ts'
import type { ContrastKind } from './contrast.ts'

// Every foreground and background pair a component may use. A component that puts a text,
// icon, or border token on a background must find that pair here; the contrast test checks
// each one in both modes (AC-3). Add the pair before using it.

export type ContrastPair = {
  readonly fg: ColorToken
  readonly bg: ColorToken
  readonly kind: ContrastKind
  readonly use: string
}

const surfaces = ['bg', 'surface', 'surfaceSunken', 'surfaceRaised'] as const

const onEverySurface = (fg: ColorToken, kind: ContrastKind, use: string): ContrastPair[] =>
  surfaces.map((bg) => ({ fg, bg, kind, use }))

export const pairs: readonly ContrastPair[] = [
  ...onEverySurface('text', 'text', 'primary text and icons'),
  ...onEverySurface('textSecondary', 'text', 'secondary text and icons'),
  ...onEverySurface('textTertiary', 'text', 'placeholders and hints'),
  ...onEverySurface('primary', 'text', 'links, ghost buttons, selected icons'),
  ...onEverySurface('danger', 'text', 'error text, destructive ghost buttons'),
  ...onEverySurface('borderStrong', 'nonText', 'input and checkbox borders'),
  ...onEverySurface('focusRing', 'nonText', 'focus outlines'),
  ...onEverySurface('collabo', 'nonText', 'Collabo marks and stop pins'),
  ...onEverySurface('info', 'nonText', 'info icons'),
  ...onEverySurface('caution', 'nonText', 'caution icons'),
  { fg: 'text', bg: 'primarySoft', kind: 'text', use: 'text in selected rows' },
  { fg: 'primary', bg: 'primarySoft', kind: 'text', use: 'chips and selected rows' },
  { fg: 'onPrimary', bg: 'primary', kind: 'text', use: 'primary button label' },
  { fg: 'onPrimary', bg: 'primaryPressed', kind: 'text', use: 'pressed primary button label' },
  { fg: 'onCollabo', bg: 'collabo', kind: 'text', use: 'filled Collabo badge' },
  { fg: 'collaboText', bg: 'collaboSoft', kind: 'text', use: 'Collabo card text and icons' },
  { fg: 'text', bg: 'collaboSoft', kind: 'text', use: 'body text in the Collabo card' },
  { fg: 'onDanger', bg: 'danger', kind: 'text', use: 'destructive button and SOS label' },
  { fg: 'danger', bg: 'dangerSoft', kind: 'text', use: 'danger banner and pill' },
  { fg: 'caution', bg: 'cautionSoft', kind: 'text', use: 'caution banner and pill' },
  { fg: 'info', bg: 'infoSoft', kind: 'text', use: 'info banner and pill' },
  { fg: 'primary', bg: 'primarySoft', kind: 'nonText', use: 'success pill icon' },
  { fg: 'text', bg: 'dangerSoft', kind: 'text', use: 'banner body text' },
  { fg: 'text', bg: 'cautionSoft', kind: 'text', use: 'banner body text' },
  { fg: 'text', bg: 'infoSoft', kind: 'text', use: 'banner body text' },
]
