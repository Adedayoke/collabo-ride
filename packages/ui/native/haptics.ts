// The one haptics helper. expo-haptics follows the system setting (it does nothing when the
// user has haptics off), and a failure is never surfaced: haptics are never the only signal.

import * as Haptics from 'expo-haptics'

function fire(play: () => Promise<void>): void {
  play().catch(() => {
    // No haptic engine, or the system has them off. The visual carries the meaning.
  })
}

export const haptics = {
  /** Something succeeded: driver found, trip complete, a correct PIN. */
  success: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Something failed: a wrong code, a declined card. */
  error: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  /** A light landing: the end of a count, a sheet detent. */
  light: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A heavy commit: the SOS hold confirming. */
  heavy: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  /** A value ticked past a step: a segment, a star, a price step. */
  selection: () => fire(() => Haptics.selectionAsync()),
} as const
