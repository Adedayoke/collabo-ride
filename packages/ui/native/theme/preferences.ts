// Device preferences: the color mode setting and the language chosen before sign in.
// Persisted to AsyncStorage; any storage failure falls back to `system` and no saved locale.

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

export const colorModeSettings = ['system', 'light', 'dark'] as const
export type ColorModeSetting = (typeof colorModeSettings)[number]

const isColorModeSetting = (value: unknown): value is ColorModeSetting =>
  typeof value === 'string' && (colorModeSettings as readonly string[]).includes(value)

type Preferences = {
  readonly colorMode: ColorModeSetting
  /** The language picked on this device before sign in; `users.locale` wins once signed in. */
  readonly locale: string | null
  setColorMode(setting: ColorModeSetting): void
  setLocale(locale: string | null): void
}

/** AsyncStorage that never throws: a failed read reads as nothing saved, a failed write is dropped. */
const safeStorage: StateStorage = {
  async getItem(name) {
    try {
      return await AsyncStorage.getItem(name)
    } catch {
      return null
    }
  },
  async setItem(name, value) {
    try {
      await AsyncStorage.setItem(name, value)
    } catch {
      // The setting still applies for this session.
    }
  },
  async removeItem(name) {
    try {
      await AsyncStorage.removeItem(name)
    } catch {
      // Nothing to undo.
    }
  },
}

export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      colorMode: 'system',
      locale: null,
      setColorMode: (colorMode) => set({ colorMode }),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'collabo.preferences',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ colorMode, locale }) => ({ colorMode, locale }),
      // Whatever was saved, only well formed values survive.
      merge: (saved, current) => {
        const fields: unknown = saved
        if (typeof fields !== 'object' || fields === null) return current
        const colorMode = 'colorMode' in fields && isColorModeSetting(fields.colorMode) ? fields.colorMode : 'system'
        const locale = 'locale' in fields && typeof fields.locale === 'string' ? fields.locale : null
        return { ...current, colorMode, locale }
      },
    },
  ),
)

/** The persisted color mode setting and its setter (AC-10). */
export function useColorModeSetting(): [ColorModeSetting, (setting: ColorModeSetting) => void] {
  const setting = usePreferences((state) => state.colorMode)
  const setSetting = usePreferences((state) => state.setColorMode)
  return [setting, setSetting]
}

/** True once saved preferences are read, so the first frame is never the wrong mode. */
export function usePreferencesHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => usePreferences.persist.onFinishHydration(onChange),
    () => usePreferences.persist.hasHydrated(),
  )
}
