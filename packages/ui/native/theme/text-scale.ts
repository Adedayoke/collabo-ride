import { create } from 'zustand'

/** The dev catalog's text size override, for AC-4's 200% check. Not persisted. */
export const useTextScaleOverride = create<{ scale: number; setScale(scale: number): void }>()((set) => ({
  scale: 1,
  setScale: (scale) => set({ scale }),
}))
