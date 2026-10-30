// Every case here must be reported, on the line its `expect` comment names.
import { Alert, StyleSheet, Text, View } from 'react-native'

declare const Toast: { show: (options: unknown) => void }
declare const Stack: { Screen: (props: { name: string; options: unknown }) => null }
declare const form: { setError: (field: string, error: { message: string }) => void }
declare const navigation: { setOptions: (options: unknown) => void }
declare const useAnimatedStyle: (worklet: () => object) => object

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#123456', // expect: collabo/ui-drift
    borderColor: 'rgb(0, 0, 0)', // expect: collabo/ui-drift
    padding: 10, // expect: collabo/ui-drift
    marginTop: -6, // expect: collabo/ui-drift
    fontSize: 15.5, // expect: collabo/ui-drift
    lineHeight: 19, // expect: collabo/ui-drift
    borderRadius: 7, // expect: collabo/ui-drift
    width: 37, // expect: collabo/ui-drift
    gap: '12px', // expect: collabo/ui-drift
  },
})

export function Bad() {
  Toast.show('Saved') // expect: collabo/no-untranslated-call
  Toast.show({ title: 'Saved', type: 'success' }) // expect: collabo/no-untranslated-call
  Alert.alert('Delete trip?') // expect: collabo/no-untranslated-call
  form.setError('phone', { message: 'Enter a phone number' }) // expect: collabo/no-untranslated-call
  navigation.setOptions({ headerTitle: 'Trip' }) // expect: collabo/no-untranslated-call
  const animated = useAnimatedStyle(() => ({ opacity: 1, top: 3 })) // expect: collabo/ui-drift
  return (
    <View style={[styles.card, animated]}>
      <View style={{ color: 'red' }} /> {/* expect: collabo/ui-drift */}
      <View style={[styles.card, { gap: 5 }]} /> {/* expect: collabo/ui-drift */}
      <View contentContainerStyle={{ paddingBottom: 30 }} /> {/* expect: collabo/ui-drift */}
      <View
        style={{
          // ui-drift-ok
          padding: 3, // expect: collabo/ui-drift
        }}
      />
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
