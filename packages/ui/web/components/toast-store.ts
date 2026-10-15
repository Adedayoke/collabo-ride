// The console's one toast slot. `Toast.show` from anywhere; `ToastHost` renders it.

import { useSyncExternalStore } from 'react'

import type { Tone } from './tone.ts'

export type ToastOptions = {
  readonly tone?: Extract<Tone, 'success' | 'info' | 'caution' | 'danger'>
  /** One follow up, such as "Undo". The toast then stays 6 seconds instead of 4. */
  readonly action?: { readonly label: string; readonly onSelect: () => void }
}

export type ToastMessage = ToastOptions & { readonly id: number; readonly message: string }

let current: ToastMessage | null = null
let nextId = 0
const listeners = new Set<() => void>()

function publish(next: ToastMessage | null): void {
  current = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const Toast = {
  /** Shows a short confirmation. The message must be translated. */
  show(message: string, options: ToastOptions = {}): void {
    nextId += 1
    publish({ id: nextId, message, ...options })
  },
  hide(): void {
    publish(null)
  },
} as const

/** The toast on screen now, for `ToastHost`. */
export function useCurrentToast(): ToastMessage | null {
  return useSyncExternalStore(subscribe, () => current)
}
