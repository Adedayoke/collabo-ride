// The one toast slot. `Toast.show` from anywhere; `ToastHost` (mounted by `AppRoot`) renders it.

import { create } from 'zustand'

import type { Tone } from './tone.ts'

export type ToastOptions = {
  readonly tone?: Extract<Tone, 'success' | 'info' | 'caution' | 'danger'>
  /** One follow up, such as "Undo". The toast then stays 6 seconds instead of 4. */
  readonly action?: { readonly label: string; readonly onPress: () => void }
}

export type ToastMessage = ToastOptions & { readonly id: number; readonly message: string }

export const useToastStore = create<{ current: ToastMessage | null }>()(() => ({ current: null }))
let nextId = 0

export const Toast = {
  /** Shows a short confirmation at the top of the screen. The message must be translated. */
  show(message: string, options: ToastOptions = {}): void {
    nextId += 1
    useToastStore.setState({ current: { id: nextId, message, ...options } })
  },
  hide(): void {
    useToastStore.setState({ current: null })
  },
} as const
