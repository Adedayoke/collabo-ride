import { useEffect, useMemo, type ReactNode } from 'react'
import { Appearance, useColorScheme } from 'react-native'

import { useColorModeSetting } from './preferences.ts'
import { buildTheme } from './theme.ts'
import { resolveColorMode, ThemeContext } from './use-theme.ts'

export type ThemeProviderProps = {
  /** The active locale, which picks DM Sans or Inter (`fonts.ts`). */
  readonly locale: string
  /** Text size multiplier for the dev catalog's 200% check. Leave at 1 everywhere else. */
  readonly textScale?: number
  readonly children: ReactNode
}

export function ThemeProvider({ locale, textScale = 1, children }: ThemeProviderProps) {
  const [setting] = useColorModeSetting()
  const system = useColorScheme()
  const mode = resolveColorMode(setting, system)

  // Mirror the setting so the status bar, keyboard, and system alerts match. With `system`
  // the override is cleared, and `useColorScheme` reports the real system appearance again.
  useEffect(() => {
    Appearance.setColorScheme(setting === 'system' ? 'unspecified' : setting)
  }, [setting])

  const theme = useMemo(() => buildTheme(mode, locale, textScale), [mode, locale, textScale])
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}
