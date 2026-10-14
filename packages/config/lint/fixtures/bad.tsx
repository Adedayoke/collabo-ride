// Every case here must be reported, on the line its `expect` comment names.
import { Alert, Text, View } from 'react-native'

declare const Toast: { show: (options: unknown) => void }
declare const Stack: { Screen: (props: { name: string; options: unknown }) => null }
declare const form: { setError: (field: string, error: { message: string }) => void }
declare const navigation: { setOptions: (options: unknown) => void }

export function Bad() {
  Toast.show('Saved') // expect: collabo/no-untranslated-call
  Toast.show({ title: 'Saved', type: 'success' }) // expect: collabo/no-untranslated-call
  Alert.alert('Delete trip?') // expect: collabo/no-untranslated-call
  form.setError('phone', { message: 'Enter a phone number' }) // expect: collabo/no-untranslated-call
  navigation.setOptions({ headerTitle: 'Trip' }) // expect: collabo/no-untranslated-call
  return (
    <View>
      {/* expect: i18next/no-literal-string */}
      <Text>Hello</Text>
      <View accessibilityLabel="Close" /> {/* expect: i18next/no-literal-string */}
      <View accessibilityHint="Opens the menu" /> {/* expect: i18next/no-literal-string */}
      <Stack.Screen name="home" options={{ title: 'Home' }} /> {/* expect: collabo/no-untranslated-call */}
      {/* expect: collabo/no-untranslated-call */}
      <Stack.Screen name="trip" options={() => ({ tabBarLabel: `Trips` })} />
      <View accessibilityValue={{ text: 'Half full' }} /> {/* expect: collabo/no-untranslated-call */}
      <input placeholder="Search" /> {/* expect: i18next/no-literal-string */}
      <img alt="Tunde smiling" src="x.png" /> {/* expect: i18next/no-literal-string */}
      <button type="button" aria-label="Pay now" /> {/* expect: i18next/no-literal-string */}
    </View>
  )
}
