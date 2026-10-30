// Every marker bitmap as a static import, so Metro bundles them and picks the @2x and @3x files.
// One import per file `markerFiles()` lists; a new shape or stop number needs a line here too.

import pickupLight from '../../map/markers/pickup-light.png'
import dropoffLight from '../../map/markers/dropoff-light.png'
import carLight from '../../map/markers/car-light.png'
import collaboStop1Light from '../../map/markers/collabo-stop-1-light.png'
import collaboStop2Light from '../../map/markers/collabo-stop-2-light.png'
import collaboStop3Light from '../../map/markers/collabo-stop-3-light.png'
import collaboStop4Light from '../../map/markers/collabo-stop-4-light.png'
import pickupDark from '../../map/markers/pickup-dark.png'
import dropoffDark from '../../map/markers/dropoff-dark.png'
import carDark from '../../map/markers/car-dark.png'
import collaboStop1Dark from '../../map/markers/collabo-stop-1-dark.png'
import collaboStop2Dark from '../../map/markers/collabo-stop-2-dark.png'
import collaboStop3Dark from '../../map/markers/collabo-stop-3-dark.png'
import collaboStop4Dark from '../../map/markers/collabo-stop-4-dark.png'
import type { ImageRequireSource } from 'react-native'

import type { CollaboStopNumber, MarkerShape } from '../../map/index.ts'
import type { ColorMode } from '../../tokens/index.ts'

type ModeImages = {
  readonly pickup: ImageRequireSource
  readonly dropoff: ImageRequireSource
  readonly car: ImageRequireSource
  readonly collaboStop: Readonly<Record<CollaboStopNumber, ImageRequireSource>>
}

const images: Readonly<Record<ColorMode, ModeImages>> = {
  light: {
    pickup: pickupLight,
    dropoff: dropoffLight,
    car: carLight,
    collaboStop: { 1: collaboStop1Light, 2: collaboStop2Light, 3: collaboStop3Light, 4: collaboStop4Light },
  },
  dark: {
    pickup: pickupDark,
    dropoff: dropoffDark,
    car: carDark,
    collaboStop: { 1: collaboStop1Dark, 2: collaboStop2Dark, 3: collaboStop3Dark, 4: collaboStop4Dark },
  },
}

/** The bitmap for one marker in one color mode. */
export function markerImage(shape: MarkerShape, mode: ColorMode, stop: CollaboStopNumber = 1): ImageRequireSource {
  const set = images[mode]
  switch (shape) {
    case 'pickup':
      return set.pickup
    case 'dropoff':
      return set.dropoff
    case 'car':
      return set.car
    case 'collaboStop':
      return set.collaboStop[stop]
  }
}
