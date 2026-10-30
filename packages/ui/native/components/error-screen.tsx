import { useTranslation } from '@collabo/i18n'
import { CircleAlert } from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'

import { useTheme } from '../theme/use-theme.ts'
import { Button } from './button.tsx'
import { Screen } from './screen.tsx'
import { Text } from './text.tsx'

export type ErrorScreenProps = {
  /** Expo Router's `ErrorBoundary` passes `retry`; it re-renders the failed route. */
  readonly retry: () => Promise<void> | void
  /** A translated message for a known error; otherwise the general one. Never the raw error. */
  readonly message?: string
}

/**
 * The fallback when a screen throws. Export it from a route as `ErrorBoundary`. It never shows
 * the error itself, which could leak internals; the error goes to error tracking (#6).
 */
export function ErrorScreen({ retry, message }: ErrorScreenProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  return (
    <Screen scroll={false} style={styles.center}>
      <View style={[styles.center, { gap: theme.spacing.lg }]}>
        <View
          style={[
            styles.medallion,
            {
              width: theme.size.avatar.xl,
              height: theme.size.avatar.xl,
              borderRadius: theme.radius.full,
              backgroundColor: theme.color.dangerSoft,
            },
          ]}
        >
          <CircleAlert size={theme.size.icon.xl} color={theme.color.danger} strokeWidth={theme.size.iconStroke} />
        </View>
        <View style={[styles.center, { gap: theme.spacing.sm }]}>
          <Text variant="title2" accessibilityRole="header" style={styles.text}>
            {t('state.error.title')}
          </Text>
          <Text variant="body" color="textSecondary" style={styles.text}>
            {message ?? t('state.error.body')}
          </Text>
        </View>
        <Button title={t('action.retry')} onPress={() => void retry()} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  medallion: { alignItems: 'center', justifyContent: 'center' },
  text: { textAlign: 'center' },
})
