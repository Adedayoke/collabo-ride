import { useEffect, useRef, useState } from 'react'
import { Marker, type LatLng } from 'react-native-maps'

import { markerSpecs } from '../../map/index.ts'
import { markerImage } from '../map/marker-images.ts'
import { useReduceMotion } from '../motion/use-reduce-motion.ts'
import { useTheme } from '../theme/use-theme.ts'

export type CarMarkerProps = {
  /** The latest reported position. */
  readonly coordinate: LatLng
  /** Degrees clockwise from north. */
  readonly heading: number
  readonly testID?: string
}

/** Moves from where the car is drawn now to `target` over `durationMs`, or jumps when motion is reduced. */
function useGlide(target: LatLng, durationMs: number, reduced: boolean): LatLng {
  const [shown, setShown] = useState(target)
  const shownRef = useRef(target)
  // Primitives, so a new object for the same position does not restart the glide.
  const { latitude, longitude } = target

  useEffect(() => {
    const from = shownRef.current
    const show = (next: LatLng) => {
      shownRef.current = next
      setShown(next)
    }
    if (reduced) {
      show({ latitude, longitude })
      return undefined
    }
    const start = Date.now()
    let frame = 0
    const step = () => {
      // Linear on purpose: the car keeps a steady speed between two location updates.
      const progress = Math.min(1, (Date.now() - start) / durationMs)
      show({
        latitude: from.latitude + (latitude - from.latitude) * progress,
        longitude: from.longitude + (longitude - from.longitude) * progress,
      })
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [latitude, longitude, durationMs, reduced])

  return shown
}

/**
 * The driver's car, seen from above and turned to its heading. It glides between location updates
 * over the 4 second gap between them; with Reduce Motion on it jumps to each new position.
 */
export function CarMarker({ coordinate, heading, testID }: CarMarkerProps) {
  const theme = useTheme()
  const reduced = useReduceMotion()
  const shown = useGlide(coordinate, theme.duration.markerGlide, reduced)
  return (
    <Marker
      key={`car-${theme.mode}`}
      coordinate={shown}
      image={markerImage('car', theme.mode)}
      anchor={markerSpecs.car.anchor}
      rotation={heading}
      flat
      tracksViewChanges={false}
      testID={testID}
    />
  )
}
