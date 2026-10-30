import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

import type { ColorToken } from '../../tokens/index.ts'
import type { IconComponent } from '../icons/index.tsx'
import { useTheme } from '../theme/use-theme.ts'
import type { IconButtonVariant } from './options.ts'

const variantColors: Record<
  IconButtonVariant,
  { bg: ColorToken | null; fg: ColorToken; pressedBg: ColorToken | null }
> = {
  plain: { bg: null, fg: 'text', pressedBg: null },
  tonal: { bg: 'primarySoft', fg: 'primary', pressedBg: null },
  filled: { bg: 'primary', fg: 'onPrimary', pressedBg: 'primaryPressed' },
}

export type IconButtonProps = {
  readonly icon: IconComponent
  /** Required: an icon alone says nothing to a screen reader. Translated. */
  readonly label: string
  readonly onPress?: () => void
  readonly variant?: IconButtonVariant
  readonly disabled?: boolean
  readonly accessibilityHint?: string
  readonly testID?: string
  readonly style?: StyleProp<ViewStyle>
}

/** A round 48 point button with one icon and a translated label for screen readers. */
export function IconButton({
  icon: Icon,
  label,
  onPress,
  variant = 'plain',
  disabled = false,
  accessibilityHint,
  testID,
  style,
}: IconButtonProps) {
  const theme = useTheme()
  const colors = variantColors[variant]
  const fg = disabled ? theme.color.disabledText : theme.color[colors.fg]
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          width: theme.size.touchTarget,
          height: theme.size.touchTarget,
          borderRadius: theme.radius.full,
          backgroundColor:
            disabled && colors.bg
              ? theme.color.disabledBg
              : pressed && colors.pressedBg
                ? theme.color[colors.pressedBg]
                : pressed
                  ? theme.color.pressedOverlay
                  : colors.bg
                    ? theme.color[colors.bg]
                    : 'transparent',
        },
        style,
      ]}
    >
      <Icon size={theme.size.icon.lg} color={fg} strokeWidth={theme.size.iconStroke} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
})
