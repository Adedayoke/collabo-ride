// Announcements and focus for screen readers (spec 0012, Announcements and focus).

import { useEffect, useRef, type RefObject } from 'react'
import { AccessibilityInfo, findNodeHandle, Platform, type View } from 'react-native'

export type AnnouncePriority = 'polite' | 'assertive'

/**
 * Speaks a message: an offer arriving, the match, a trip status change. `assertive` is for a
 * driver's incoming request. iOS queues polite messages behind what is being read.
 */
export function announce(message: string, priority: AnnouncePriority = 'polite'): void {
  if (Platform.OS === 'ios') {
    AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: priority === 'polite' })
    return
  }
  AccessibilityInfo.announceForAccessibility(message)
}

/** Moves screen reader focus to an element, such as a sheet or dialog title, when it mounts. */
export function useFocusOnMount(ref: RefObject<View | null>, enabled = true): void {
  useEffect(() => {
    if (!enabled) return
    // Wait a frame so the element is laid out before focus moves to it.
    const frame = requestAnimationFrame(() => {
      const node = ref.current ? findNodeHandle(ref.current) : null
      if (node !== null) AccessibilityInfo.setAccessibilityFocus(node)
    })
    return () => cancelAnimationFrame(frame)
  }, [ref, enabled])
}

/** Moves screen reader focus back to the control that opened an overlay once it closes. */
export function useReturnFocus(open: boolean, returnTo: RefObject<View | null> | undefined): void {
  const wasOpen = useRef(open)
  useEffect(() => {
    const closed = wasOpen.current && !open
    wasOpen.current = open
    if (!closed || !returnTo) return
    const frame = requestAnimationFrame(() => {
      const node = returnTo.current ? findNodeHandle(returnTo.current) : null
      if (node !== null) AccessibilityInfo.setAccessibilityFocus(node)
    })
    return () => cancelAnimationFrame(frame)
  }, [open, returnTo])
}

/** Count downs announce only at these seconds left. */
export const countdownAnnouncements = [30, 10] as const
