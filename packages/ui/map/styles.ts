// The two Google Maps styles, passed to react-native-maps `customMapStyle`: muted land and water
// near the `bg` tones, roads in clear neutral greys, business labels off, transit and parks faint.
// The style follows the resolved color mode.

import type { ColorMode } from '../tokens/index.ts'
import dark from './map-style-dark.json'
import light from './map-style-light.json'

export type MapStyleRule = {
  readonly featureType?: string
  readonly elementType?: string
  readonly stylers: readonly Readonly<Record<string, string | number>>[]
}

export type MapStyle = readonly MapStyleRule[]

export const mapStyles: Readonly<Record<ColorMode, MapStyle>> = { light, dark }

/** Which part of the map a geometry color paints, for the marker contrast check (AC-9). */
export type MapSurface = 'land' | 'road' | 'water'

function surfaceOf(rule: MapStyleRule): MapSurface | null {
  const element = rule.elementType ?? 'all'
  if (!element.startsWith('geometry') && element !== 'all') return null
  const feature = rule.featureType ?? 'all'
  if (feature.startsWith('road')) return 'road'
  if (feature.startsWith('water')) return 'water'
  if (feature === 'all' || feature.startsWith('landscape') || feature.startsWith('poi') || feature === 'transit') {
    return 'land'
  }
  return null
}

/** Every land, road, and water geometry color a style sets: what markers sit on. */
export function mapSurfaceColors(style: MapStyle): readonly { readonly surface: MapSurface; readonly color: string }[] {
  return style.flatMap((rule) => {
    const surface = surfaceOf(rule)
    if (!surface) return []
    return rule.stylers.flatMap((styler) =>
      typeof styler.color === 'string' ? [{ surface, color: styler.color }] : [],
    )
  })
}
