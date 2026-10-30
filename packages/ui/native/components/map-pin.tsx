import { Marker, type LatLng } from 'react-native-maps'

import { markerSpecs, type CollaboStopNumber } from '../../map/index.ts'
import { markerImage } from '../map/marker-images.ts'
import { useTheme } from '../theme/use-theme.ts'

export type MapPinProps = {
  readonly coordinate: LatLng
  readonly testID?: string
} & ({ readonly kind: 'pickup' | 'dropoff' } | { readonly kind: 'collaboStop'; readonly stop: CollaboStopNumber })

/**
 * A pickup, drop off, or numbered Collabo stop on the map, drawn from the bitmap for the current
 * color mode. Markers are not read one by one: the map is one element with a summary label.
 */
export function MapPin(props: MapPinProps) {
  const theme = useTheme()
  const spec = markerSpecs[props.kind]
  const stop = props.kind === 'collaboStop' ? props.stop : undefined
  return (
    <Marker
      key={`${props.kind}-${stop ?? 0}-${theme.mode}`}
      coordinate={props.coordinate}
      image={markerImage(props.kind, theme.mode, stop)}
      anchor={spec.anchor}
      tracksViewChanges={false}
      testID={props.testID}
    />
  )
}
