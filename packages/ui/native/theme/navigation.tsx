// Theme for Expo Router's stacks and tabs, built from the same tokens.

import { DarkTheme, DefaultTheme, type NativeStackNavigationOptions, type Theme as NavigationTheme } from 'expo-router'
import type { BottomTabNavigationOptions } from 'expo-router/tabs'
import { useMemo } from 'react'

import { Text } from '../components/text.tsx'
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

/** `screenOptions` for a native stack: header font, colors, and the screen background. */
export function useStackScreenOptions(): NativeStackNavigationOptions {
  const theme = useTheme()
  return useMemo(
    () => ({
      headerTintColor: theme.color.primary,
      headerStyle: { backgroundColor: theme.color.bg },
      headerTitleStyle: { fontFamily: theme.font(600), color: theme.color.text },
      headerLargeTitleStyle: { fontFamily: theme.font(700), color: theme.color.text },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: theme.color.bg },
    }),
    [theme],
  )
}

/**
 * `screenOptions` for tabs. Tab switches never animate, and labels scale with system text up to
 * the tab bar cap (1.3), so the bar keeps its shape.
 */
export function useTabsScreenOptions(): BottomTabNavigationOptions {
  const theme = useTheme()
  return useMemo(
    () => ({
      animation: 'none',
      tabBarActiveTintColor: theme.color.primary,
      tabBarInactiveTintColor: theme.color.textSecondary,
      tabBarStyle: { backgroundColor: theme.color.surface, borderTopColor: theme.color.border },
      tabBarLabel: ({ color, children }) => (
        <Text variant="caption" maxFontSizeMultiplier={theme.maxFontScale.tabBar} style={{ color }}>
          {children}
        </Text>
      ),
      headerStyle: { backgroundColor: theme.color.bg },
      headerTitleStyle: { fontFamily: theme.font(600), color: theme.color.text },
      headerShadowVisible: false,
    }),
    [theme],
  )
}
