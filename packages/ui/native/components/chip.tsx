import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

import type { IconComponent } from '../icons/index.tsx'
import { haptics } from '../haptics.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

export type ChipProps = {
  /** Translated. */
  readonly label: string
  readonly selected?: boolean
  readonly onPress?: () => void
  readonly icon?: IconComponent
  readonly disabled?: boolean
  readonly testID?: string
  readonly style?: StyleProp<ViewStyle>
}

/**
 * A compact filter or quick choice. It is 40 points tall and reaches a 48 point target through
 * hit slop. A selected chip shows a tint and a stronger border, not color alone.
 */
export function Chip({ label, selected = false, onPress, icon: Icon, disabled = false, testID, style }: ChipProps) {
  const theme = useTheme()
  const height = theme.size.button.sm
  const fg = disabled ? theme.color.disabledText : selected ? theme.color.primary : theme.color.text
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.selection()
        onPress?.()
      }}
      hitSlop={(theme.size.touchTarget - height) / 2}
      testID={testID}
      style={({ pressed }) => [
        styles.chip,
        {
          minHeight: height,
          paddingHorizontal: theme.spacing.md,
          gap: theme.spacing.xs,
          borderRadius: theme.radius.sm,
          borderWidth: selected ? theme.size.focusRing.width : 1,
          borderColor: selected ? theme.color.primary : theme.color.borderStrong,
          backgroundColor: disabled
            ? theme.color.disabledBg
            : pressed
              ? theme.color.pressedOverlay
              : selected
                ? theme.color.primarySoft
                : theme.color.surface,
        },
        style,
      ]}
    >
      {Icon ? <Icon size={theme.size.icon.sm} color={fg} strokeWidth={theme.size.iconStroke} /> : null}
      <Text variant="subhead" style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderCurve: 'continuous' },
})
