import { useTranslation } from '@collabo/i18n'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { CollaboMark } from '../icons/index.tsx'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

export type CollaboBadgeProps = {
  /** `filled` on neutral surfaces, `soft` inside the amber Collabo card. */
  readonly variant?: 'filled' | 'soft'
  readonly style?: StyleProp<ViewStyle>
}

/** Marks a shared trip. Always says "Collabo", so amber is never the only cue. */
export function CollaboBadge({ variant = 'filled', style }: CollaboBadgeProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const fg = variant === 'filled' ? theme.color.onCollabo : theme.color.collaboText
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={t('collabo.badge')}
      style={[
        styles.badge,
        {
          backgroundColor: variant === 'filled' ? theme.color.collabo : theme.color.collaboSoft,
          borderRadius: theme.radius.full,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xxs,
          gap: theme.spacing.xs,
        },
        style,
      ]}
    >
      <CollaboMark size={theme.size.icon.sm} color={fg} />
      <Text variant="caption" style={{ color: fg }}>
        {t('collabo.badge')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
})
