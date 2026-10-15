// The Google Maps style for the current color mode, ready for react-native-maps `customMapStyle`.

import type { MapStyleElement } from 'react-native-maps'

import { mapStyles, type MapStyle } from '../../map/index.ts'
import type { ColorMode } from '../../tokens/index.ts'
import { useTheme } from '../theme/use-theme.ts'

// react-native-maps takes mutable arrays, so each style is copied once, not on every render.
function toElements(style: MapStyle): MapStyleElement[] {
  return style.map((rule) => ({ ...rule, stylers: rule.stylers.map((styler) => ({ ...styler })) }))
}

const elements: Readonly<Record<ColorMode, MapStyleElement[]>> = {
  light: toElements(mapStyles.light),
  dark: toElements(mapStyles.dark),
}

/** Switches with the color mode, so a dark phone gets the dark map (AC-9). */
export function useMapStyle(): MapStyleElement[] {
  return elements[useTheme().mode]
}
