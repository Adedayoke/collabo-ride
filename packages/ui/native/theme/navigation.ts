// Theme for Expo Router's stacks and tabs, built from the same tokens.

import { DarkTheme, DefaultTheme, type Theme as NavigationTheme } from 'expo-router'
import { useMemo } from 'react'

import { useTheme } from './use-theme.ts'

export function useNavigationTheme(): NavigationTheme {
  const theme = useTheme()
  return useMemo(() => {
    const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme
    return {
      ...base,
      dark: theme.mode === 'dark',
      colors: {
        primary: theme.color.primary,
        background: theme.color.bg,
        card: theme.color.surface,
        text: theme.color.text,
        border: theme.color.border,
        notification: theme.color.danger,
      },
      fonts: {
        regular: { fontFamily: theme.font(400), fontWeight: '400' },
        medium: { fontFamily: theme.font(500), fontWeight: '500' },
        bold: { fontFamily: theme.font(600), fontWeight: '600' },
        heavy: { fontFamily: theme.font(700), fontWeight: '700' },
      },
    }
  }, [theme])
}
