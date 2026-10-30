// The single Reduce Motion source every component reads. It asks once, then follows
// `reduceMotionChanged`, so a live change takes effect at once on every mounted component.

import { useSyncExternalStore } from 'react'
import { AccessibilityInfo } from 'react-native'

let reduced = false
let started = false
const listeners = new Set<() => void>()

function publish(next: boolean): void {
  if (next === reduced) return
  reduced = next
  for (const listener of listeners) listener()
}

function start(): void {
  if (started) return
  started = true
  AccessibilityInfo.isReduceMotionEnabled()
    .then(publish)
    .catch(() => {
      // Unknown: keep full motion, which every moment still keeps under 900 ms.
    })
  AccessibilityInfo.addEventListener('reduceMotionChanged', publish)
}

function subscribe(listener: () => void): () => void {
  start()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** True while the system's Reduce Motion setting is on. */
export function useReduceMotion(): boolean {
  return useSyncExternalStore(subscribe, () => reduced)
}
