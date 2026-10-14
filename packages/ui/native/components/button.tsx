import type { LucideIcon } from 'lucide-react-native'
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import type { ColorToken } from '../../tokens/index.ts'
import { useTheme } from '../theme/use-theme.ts'
import type { ButtonSize, ButtonVariant } from './button-options.ts'
import { Text } from './text.tsx'

/** Background and label per variant. Every pair is listed in `tokens/pairs.ts`. */
const variantColors: Record<
  ButtonVariant,
  { background: ColorToken | null; label: ColorToken; pressed: ColorToken | null }
> = {
  primary: { background: 'primary', label: 'onPrimary', pressed: 'primaryPressed' },
  secondary: { background: 'primarySoft', label: 'primary', pressed: null },
  ghost: { background: null, label: 'primary', pressed: null },
  destructive: { background: 'danger', label: 'onDanger', pressed: null },
}

export type ButtonProps = {
  /** The translated label. It is also the accessibility label. */
  readonly title: string
  readonly onPress?: () => void
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly loading?: boolean
  readonly disabled?: boolean
  readonly icon?: LucideIcon
  readonly accessibilityHint?: string
  readonly testID?: string
  readonly style?: StyleProp<ViewStyle>
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  accessibilityHint,
  testID,
  style,
}: ButtonProps) {
  const theme = useTheme()
  const colors = variantColors[variant]
  const inactive = disabled || loading
  const height = theme.size.button[size]
  // A small button keeps a 48 point touch target through hit slop.
  const slop = Math.max(0, (theme.size.touchTarget - height) / 2)
  const label = disabled ? theme.color.disabledText : theme.color[colors.label]
  const iconSize = size === 'lg' ? theme.size.icon.lg : theme.size.icon.md

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      hitSlop={slop}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: height,
          paddingHorizontal: size === 'sm' ? theme.spacing.md : theme.spacing.xl,
          gap: theme.spacing.sm,
          borderRadius: theme.radius.md,
          backgroundColor: disabled
            ? theme.color.disabledBg
            : pressed && colors.pressed
              ? theme.color[colors.pressed]
              : colors.background
                ? theme.color[colors.background]
                : 'transparent',
        },
        style,
      ]}
    >
      {({ pressed }) => (
        <>
          {pressed && !colors.pressed && !inactive ? (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: theme.color.pressedOverlay, borderRadius: theme.radius.md },
              ]}
            />
          ) : null}
          {loading ? (
            <ActivityIndicator color={label} />
          ) : (
            <>
              {Icon ? <Icon size={iconSize} color={label} strokeWidth={1.75} /> : null}
              <Text variant="headline" style={[styles.label, { color: label }]} numberOfLines={2}>
                {title}
              </Text>
            </>
          )}
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  label: { textAlign: 'center', flexShrink: 1 },
})
