// Loads DM Sans and Inter at runtime under the same names the expo-font config plugin embeds
// them by (`fontFamilyName`), so release builds, development builds, and Expo Go agree.

import { useFonts } from 'expo-font'

import { fontWeights, type FontSet, type FontWeight } from '../../tokens/index.ts'
import { fontFamilyName } from './theme.ts'

// Metro needs static requires for assets.
const files: Record<FontSet, Record<FontWeight, number>> = {
  DMSans: {
    400: require('../../fonts/DMSans_400Regular.ttf'),
    500: require('../../fonts/DMSans_500Medium.ttf'),
    600: require('../../fonts/DMSans_600SemiBold.ttf'),
    700: require('../../fonts/DMSans_700Bold.ttf'),
  },
  Inter: {
    400: require('../../fonts/Inter_400Regular.ttf'),
    500: require('../../fonts/Inter_500Medium.ttf'),
    600: require('../../fonts/Inter_600SemiBold.ttf'),
    700: require('../../fonts/Inter_700Bold.ttf'),
  },
}

const fontMap: Record<string, number> = {}
for (const set of ['DMSans', 'Inter'] as const) {
  for (const weight of fontWeights) fontMap[fontFamilyName(set, weight)] = files[set][weight]
}

/** True once the fonts are ready, or failed to load (text then falls back to the system font). */
export function useKitFonts(): boolean {
  const [loaded, error] = useFonts(fontMap)
  return loaded || error !== null
}
