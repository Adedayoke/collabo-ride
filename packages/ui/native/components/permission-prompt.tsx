import { useTranslation } from '@collabo/i18n'
import { Bell, MapPin } from 'lucide-react-native'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import type { IconComponent } from '../icons/index.tsx'
import { useTheme } from '../theme/use-theme.ts'
import { Button } from './button.tsx'
import { Text } from './text.tsx'
import type { PermissionKind } from './options.ts'

const kindIcon: Record<PermissionKind, IconComponent> = { location: MapPin, notifications: Bell }

export type PermissionPromptProps = {
  readonly kind: PermissionKind
  /** Ask the system for the permission. Shown before the system prompt, never instead of it. */
  readonly onAllow: () => void
  readonly onSkip: () => void
  readonly loading?: boolean
  readonly style?: StyleProp<ViewStyle>
}

/** Explains why the app wants a permission, in plain words, right before the system asks. */
export function PermissionPrompt({ kind, onAllow, onSkip, loading = false, style }: PermissionPromptProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const Icon = kindIcon[kind]
  return (
    <View style={[styles.wrap, { gap: theme.spacing.xl, padding: theme.spacing.xl }, style]}>
      <View
        style={[
          styles.medallion,
          {
            width: theme.size.avatar.xl,
            height: theme.size.avatar.xl,
            borderRadius: theme.radius.full,
            backgroundColor: theme.color.primarySoft,
          },
        ]}
      >
        <Icon size={theme.size.icon.xl} color={theme.color.primary} strokeWidth={theme.size.iconStroke} />
      </View>
      <View style={[styles.center, { gap: theme.spacing.sm }]}>
        <Text variant="title2" accessibilityRole="header" style={styles.centerText}>
          {t(`permission.${kind}.title`)}
        </Text>
        <Text variant="body" color="textSecondary" style={styles.centerText}>
          {t(`permission.${kind}.body`)}
        </Text>
      </View>
      <View style={[styles.actions, { gap: theme.spacing.sm }]}>
        <Button title={t('action.allow')} size="lg" loading={loading} onPress={onAllow} />
        <Button title={t('action.notNow')} variant="ghost" disabled={loading} onPress={onSkip} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  medallion: { alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center' },
  centerText: { textAlign: 'center' },
  actions: { alignSelf: 'stretch' },
})
