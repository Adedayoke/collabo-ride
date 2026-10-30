import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { haptics } from '../haptics.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

export type RadioOption<T extends string> = {
  readonly value: T
  /** Translated. */
  readonly label: string
  readonly description?: string
}

export type RadioGroupProps<T extends string> = {
  /** Names the group for screen readers. Translated. */
  readonly label: string
  readonly options: readonly RadioOption<T>[]
  readonly value: T
  readonly onChange: (value: T) => void
  readonly disabled?: boolean
  readonly style?: StyleProp<ViewStyle>
}

/** One choice from a short list, each option a full 48 point row. */
export function RadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  style,
}: RadioGroupProps<T>) {
  const theme = useTheme()
  const dot = theme.size.icon.lg
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={style}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityHint={option.description}
            accessibilityState={{ checked: selected, disabled }}
            disabled={disabled}
            onPress={() => {
              if (selected) return
              haptics.selection()
              onChange(option.value)
            }}
            style={({ pressed }) => [
              styles.row,
              {
                minHeight: theme.size.touchTarget,
                gap: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                backgroundColor: pressed ? theme.color.pressedOverlay : 'transparent',
                borderRadius: theme.radius.sm,
              },
            ]}
          >
            <View
              style={[
                styles.ring,
                {
                  width: dot,
                  height: dot,
                  borderRadius: theme.radius.full,
                  borderWidth: theme.size.focusRing.width,
                  borderColor: disabled
                    ? theme.color.disabledText
                    : selected
                      ? theme.color.primary
                      : theme.color.borderStrong,
                },
              ]}
            >
              {selected ? (
                <View
                  style={{
                    width: theme.spacing.md,
                    height: theme.spacing.md,
                    borderRadius: theme.radius.full,
                    backgroundColor: disabled ? theme.color.disabledText : theme.color.primary,
                  }}
                />
              ) : null}
            </View>
            <View style={[styles.text, { gap: theme.spacing.xxs }]}>
              <Text variant="body" color={disabled ? 'disabledText' : 'text'}>
                {option.label}
              </Text>
              {option.description ? (
                <Text variant="footnote" color={disabled ? 'disabledText' : 'textSecondary'}>
                  {option.description}
                </Text>
              ) : null}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  ring: { alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
})
