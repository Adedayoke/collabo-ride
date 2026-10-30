// Nothing here may be reported.
import { Alert, StyleSheet, Text, View } from 'react-native'

declare const t: (key: string, values?: Record<string, unknown>) => string
declare const Toast: { show: (options: unknown) => void }
declare const Stack: { Screen: (props: { name: string; options: unknown }) => null }
declare const Button: (props: { variant: string; title: string; testID: string }) => null
declare const form: { setError: (field: string, error: { message: string }) => void }
declare const theme: { color: { primary: string }; spacing: { lg: number }; radius: { md: number } }

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.primary,
    borderColor: 'transparent',
    padding: theme.spacing.lg,
    margin: 0,
    marginTop: -8,
    gap: 16,
    width: '50%',
    height: 'auto',
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderTopLeftRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 17,
    lineHeight: 24,
    flex: 1,
    // ui-drift-ok: the map attribution needs this exact inset
    bottom: 6,
  },
})

export function Good({ count }: { count: number }) {
  Toast.show({ title: t('trip.saved'), type: 'success' })
  Alert.alert(t('trip.delete.title'), t('trip.delete.body'))
  form.setError('phone', { message: t('field.phoneInvalid') })
  return (
    <View testID="home" style={[styles.card, { opacity: 0.5, transform: [{ scale: 0.97 }] }]}>
      <Text>{t('home.title')}</Text>
      <Text>{count}</Text>
      <Text> </Text>
      <Button variant="primary" title={t('action.next')} testID="next" />
      <View accessibilityLabel={t('action.close')} accessibilityRole="button" />
      <Stack.Screen name="home" options={{ title: t('home.title'), headerShown: false }} />
      <View accessibilityValue={{ min: 0, max: 10, now: 5 }} />
    </View>
  )
}
