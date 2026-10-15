import { useStackScreenOptions } from '@collabo/ui/native'
import { Stack } from 'expo-router'

// Development builds only: Metro leaves this group out unless EXPO_PUBLIC_DEV_UI is true.
export default function DevLayout() {
  return <Stack screenOptions={{ ...useStackScreenOptions(), headerShown: true }} />
}
