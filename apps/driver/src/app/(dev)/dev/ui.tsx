import { UiCatalog } from '@collabo/ui/native/catalog'
import { Stack } from 'expo-router'

export default function UiCatalogScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'UI catalog' }} />
      <UiCatalog />
    </>
  )
}
