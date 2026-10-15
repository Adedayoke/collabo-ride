// The resolved theme for one color mode and one locale: what `useTheme()` returns.

import { Platform, type TextStyle } from 'react-native'

import {
  color,
  duration,
  elevation,
  fontFamilies,
  fontSetForLocale,
  maxFontScale,
  opacity,
  radius,
  screenPadding,
  size,
  spacing,
  spring,
  type,
  zIndex,
  type ColorMode,
  type ColorPalette,
  type ElevationToken,
  type FontSet,
  type FontWeight,
  type TypeToken,
} from '../../tokens/index.ts'

export type TypeStyle = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'fontVariant'>

export type Theme = {
  readonly mode: ColorMode
  readonly color: ColorPalette
  readonly elevation: Readonly<Record<ElevationToken, string>>
  readonly fontSet: FontSet
  /** The `fontFamily` for a weight in this locale's font set, as this platform names it. */
  font(weight: FontWeight): string
  /** A type step as a text style, scaled by the dev catalog's text scale override. */
  text(step: TypeToken): TypeStyle
  readonly textScale: number
  readonly spacing: typeof spacing
  readonly radius: typeof radius
  readonly size: typeof size
  readonly zIndex: typeof zIndex
  readonly duration: typeof duration
  readonly spring: typeof spring
  readonly maxFontScale: typeof maxFontScale
  readonly opacity: typeof opacity
  readonly screenPadding: number
}

/** iOS registers a font by its PostScript name; Android and the web by its file name. */
export function fontFamilyName(set: FontSet, weight: FontWeight): string {
  const face = fontFamilies[set][weight]
  return Platform.OS === 'ios' ? face.postscriptName : face.token
}

export function buildTheme(mode: ColorMode, locale: string, textScale = 1): Theme {
  const fontSet = fontSetForLocale(locale)
  const font = (weight: FontWeight) => fontFamilyName(fontSet, weight)
  return {
    mode,
    color: color[mode],
    elevation: elevation[mode],
    fontSet,
    font,
    text(step) {
      const token = type[step]
      return {
        fontFamily: font(token.weight),
        fontSize: token.size * textScale,
        lineHeight: token.lineHeight * textScale,
        ...(token.tabular ? { fontVariant: ['tabular-nums'] } : {}),
      }
    },
    textScale,
    spacing,
    radius,
    size,
    zIndex,
    duration,
    spring,
    maxFontScale,
    opacity,
    screenPadding,
  }
}
