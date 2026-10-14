import { AppRoot } from '@collabo/ui/native'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'

// Held until fonts and the saved color mode are in, so the first frame is never the wrong mode.
void SplashScreen.preventAutoHideAsync()

const devUi = process.env.EXPO_PUBLIC_DEV_UI === 'true'

export default function RootLayout() {
  return (
    <AppRoot surface="rider" devUi={devUi}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </AppRoot>
  )
}
