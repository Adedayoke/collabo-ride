// Reanimated presets built only from the motion tokens. Each takes the Reduce Motion flag from
// `useReduceMotion()` and, when it is on, becomes a fade of `reducedFade` with no movement.

import { Easing, FadeIn, FadeInDown, FadeInUp, FadeOut, ReduceMotion, SlideInDown } from 'react-native-reanimated'

import { duration, easeOut, spring } from '../../tokens/index.ts'

export const easeOutCurve = Easing.bezier(...easeOut)

export const springConfig = {
  gentle: { ...spring.gentle, reduceMotion: ReduceMotion.System },
  snappy: { ...spring.snappy, reduceMotion: ReduceMotion.System },
} as const

/** The Reduce Motion stand in for every entrance: a short fade, played even when motion is reduced. */
export const reducedFade = (delay = 0) =>
  FadeIn.duration(duration.reducedFade).delay(delay).reduceMotion(ReduceMotion.Never)

/** An element entering in place: a small rise and fade (toasts, offers, banners). */
export function enterUp(reduced: boolean, delay = 0) {
  if (reduced) return reducedFade(delay)
  return FadeInDown.duration(duration.base).easing(easeOutCurve).delay(delay)
}

/** An element entering from the top edge (toasts on native). */
export function enterDown(reduced: boolean) {
  if (reduced) return reducedFade()
  return FadeInUp.duration(duration.base).easing(easeOutCurve)
}

/** A card rising from the bottom and settling with `springGentle` (driver found, offers). */
export function riseIn(reduced: boolean) {
  if (reduced) return reducedFade()
  return SlideInDown.springify().damping(spring.gentle.damping).stiffness(spring.gentle.stiffness)
}

/** A plain fade in, for parts that appear one after another inside a moving card. */
export function fadeIn(reduced: boolean, delay = 0) {
  if (reduced) return reducedFade()
  return FadeIn.duration(duration.base).easing(easeOutCurve).delay(delay)
}

/** Every exit is a quick fade: leaving needs less attention than arriving. */
export const fadeOut = FadeOut.duration(duration.fast)
