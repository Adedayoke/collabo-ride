// The shell both apps start from: holds the splash until fonts and saved preferences are in,
// then provides translations, the theme, and the navigation theme.

import { availableLocales, createI18n, I18nextProvider, resolveLocale, type Locale } from '@collabo/i18n'
import { ThemeProvider as NavigationThemeProvider } from 'expo-router'
import { getLocales } from 'expo-localization'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState, type ReactNode } from 'react'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { ToastHost } from './components/toast.tsx'
import { useReduceMotion } from './motion/use-reduce-motion.ts'
import { useKitFonts } from './theme/fonts.ts'
import { useNavigationTheme } from './theme/navigation.tsx'
import { usePreferences, usePreferencesHydrated } from './theme/preferences.ts'
import { useTextScaleOverride } from './theme/text-scale.ts'
import { ThemeProvider } from './theme/theme-provider.tsx'

export type AppRootProps = {
  readonly surface: 'rider' | 'driver'
  /** Development builds with the `/dev/ui` catalog: also offers the `en-XA` pseudo locale. */
  readonly devUi: boolean
  /** `users.locale` once signed in (spec 0010); it wins over the device choice. */
  readonly userLocale?: string | null
  readonly children: ReactNode
}

function NavigationTheme({ children }: { readonly children: ReactNode }) {
  return <NavigationThemeProvider value={useNavigationTheme()}>{children}</NavigationThemeProvider>
}

export function AppRoot({ surface, devUi, userLocale = null, children }: AppRootProps) {
  const fontsReady = useKitFonts()
  const preferencesReady = usePreferencesHydrated()
  const savedLocale = usePreferences((state) => state.locale)
  const textScale = useTextScaleOverride((state) => state.scale)
  // Ask for Reduce Motion now, so the first expressive moment already knows the answer.
  useReduceMotion()

  const locale: Locale = resolveLocale({
    userLocale,
    savedLocale,
    deviceLocales: getLocales().map((deviceLocale) => deviceLocale.languageTag),
    available: availableLocales(devUi),
  })

  // One instance for the app's life, created with the first locale; later changes go through it.
  const [i18n] = useState(() => createI18n({ surface, locale, pseudo: devUi }))
  useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale)
  }, [i18n, locale])

  const ready = fontsReady && preferencesReady
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null
  return (
    <GestureHandlerRootView style={styles.fill}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider locale={locale} textScale={textScale}>
          <NavigationTheme>{children}</NavigationTheme>
          <ToastHost />
        </ThemeProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
})
