import { ChevronRight } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View, type AccessibilityRole, type StyleProp, type ViewStyle } from 'react-native'

import type { IconComponent } from '../icons/index.tsx'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

export type ListItemProps = {
  /** Translated. */
  readonly title: string
  /** A second line of detail. Translated. */
  readonly subtitle?: string
  /** An icon on the start edge. */
  readonly leadingIcon?: IconComponent
  /** Any element on the start edge instead of an icon, such as an avatar. */
  readonly leading?: ReactNode
  /** Something on the end edge: a value, a switch, a badge. */
  readonly trailing?: ReactNode
  readonly onPress?: () => void
  /** Show a chevron: the row opens another screen. */
  readonly chevron?: boolean
  readonly selected?: boolean
  readonly disabled?: boolean
  readonly accessibilityRole?: AccessibilityRole
  readonly accessibilityHint?: string
  readonly testID?: string
  readonly style?: StyleProp<ViewStyle>
}

/**
 * A full width row. Pressed rows tint their background rather than scale, since a scaling row
 * reads as the whole screen squishing. Grows with large text: no fixed height.
 */
export function ListItem({
  title,
  subtitle,
  leadingIcon: Leading,
  leading,
  trailing,
  onPress,
  chevron = false,
  selected = false,
  disabled = false,
  accessibilityRole,
  accessibilityHint,
  testID,
  style,
}: ListItemProps) {
  const theme = useTheme()
  const content = (pressed: boolean) => (
    <View
      style={[
        styles.row,
        {
          minHeight: theme.size.touchTarget + theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          gap: theme.spacing.md,
          backgroundColor: pressed ? theme.color.pressedOverlay : selected ? theme.color.primarySoft : 'transparent',
        },
      ]}
    >
      {Leading ? (
        <Leading
          size={theme.size.icon.lg}
          color={disabled ? theme.color.disabledText : selected ? theme.color.primary : theme.color.textSecondary}
          strokeWidth={theme.size.iconStroke}
        />
      ) : (
        (leading ?? null)
      )}
      <View style={[styles.text, { gap: theme.spacing.xxs }]}>
        <Text variant="headline" color={disabled ? 'disabledText' : 'text'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="subhead" color={disabled ? 'disabledText' : 'textSecondary'}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {chevron ? (
        <ChevronRight size={theme.size.icon.md} color={theme.color.textSecondary} strokeWidth={theme.size.iconStroke} />
      ) : null}
    </View>
  )

  if (!onPress) {
    return (
      <View testID={testID} style={style}>
        {content(false)}
      </View>
    )
  }
  return (
    <Pressable
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={style}
    >
      {({ pressed }) => content(pressed)}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { flex: 1 },
})
