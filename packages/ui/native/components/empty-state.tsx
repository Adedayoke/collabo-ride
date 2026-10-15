import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import type { IconComponent } from '../icons/index.tsx'
import { useTheme } from '../theme/use-theme.ts'
import { Button } from './button.tsx'
import { Text } from './text.tsx'

export type EmptyStateProps = {
  readonly icon: IconComponent
  /** Why it is empty. Translated. */
  readonly title: string
  /** What to do about it. Translated. */
  readonly body?: string
  readonly action?: { readonly label: string; readonly onPress: () => void }
  readonly style?: StyleProp<ViewStyle>
}

/** What a screen shows when there is nothing yet: why, and the next step. */
export function EmptyState({ icon: Icon, title, body, action, style }: EmptyStateProps) {
  const theme = useTheme()
  return (
    <View style={[styles.wrap, { gap: theme.spacing.md, paddingVertical: theme.spacing.xxl }, style]}>
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
      <View style={[styles.text, { gap: theme.spacing.xs }]}>
        <Text variant="title3" accessibilityRole="header" style={styles.center}>
          {title}
        </Text>
        {body ? (
          <Text variant="callout" color="textSecondary" style={styles.center}>
            {body}
          </Text>
        ) : null}
      </View>
      {action ? <Button variant="secondary" title={action.label} onPress={action.onPress} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  medallion: { alignItems: 'center', justifyContent: 'center' },
  text: { alignItems: 'center' },
  center: { textAlign: 'center' },
})
