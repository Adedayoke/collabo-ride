// The console's color mode: `system` follows `prefers-color-scheme`; `light` and `dark` set
// `data-theme` on <html>, which `tokens.css` honours over the media query. Saved per browser.

import { useSyncExternalStore } from 'react'

export const colorModeSettings = ['system', 'light', 'dark'] as const
export type ColorModeSetting = (typeof colorModeSettings)[number]

const storageKey = 'collabo.colorMode'
const listeners = new Set<() => void>()
let current: ColorModeSetting | null = null

const isSetting = (value: unknown): value is ColorModeSetting =>
  typeof value === 'string' && (colorModeSettings as readonly string[]).includes(value)

function read(): ColorModeSetting {
  try {
    const saved = window.localStorage.getItem(storageKey)
    return isSetting(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}

function apply(setting: ColorModeSetting): void {
  const root = document.documentElement
  if (setting === 'system') delete root.dataset.theme
  else root.dataset.theme = setting
}

export function setColorMode(setting: ColorModeSetting): void {
  current = setting
  try {
    window.localStorage.setItem(storageKey, setting)
  } catch {
    // Private windows and blocked storage: the choice still applies until reload.
  }
  apply(setting)
  for (const listener of listeners) listener()
}

/** Applies the saved setting. Call once before the first render. */
export function initColorMode(): void {
  apply(read())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useColorMode(): [ColorModeSetting, (setting: ColorModeSetting) => void] {
  return [useSyncExternalStore(subscribe, () => (current ??= read())), setColorMode]
}
