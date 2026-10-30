import { createContext, useContext } from 'react'

import type { ColorMode } from '../../tokens/index.ts'
import type { ColorModeSetting } from './preferences.ts'
import type { Theme } from './theme.ts'

export const ThemeContext = createContext<Theme | null>(null)

/** Light or dark: the saved setting when it forces one, else the system appearance. */
export function resolveColorMode(setting: ColorModeSetting, system: string | null | undefined): ColorMode {
  if (setting !== 'system') return setting
  return system === 'dark' ? 'dark' : 'light'
}

/** The resolved tokens for the current color mode and locale. */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext)
  if (!theme) throw new Error('useTheme() needs a <ThemeProvider> above it')
  return theme
}
