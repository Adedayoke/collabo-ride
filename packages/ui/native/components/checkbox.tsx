import { Check } from 'lucide-react-native'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { haptics } from '../haptics.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

export type CheckboxProps = {
  /** Translated. */
  readonly label: string
  readonly description?: string
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
  readonly disabled?: boolean
  readonly testID?: string
  readonly style?: StyleProp<ViewStyle>
}

/** A box and its label in one 48 point row; the whole row toggles it. */
export function Checkbox({ label, description, checked, onChange, disabled = false, testID, style }: CheckboxProps) {
  const theme = useTheme()
  const box = theme.size.icon.lg
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.selection()
        onChange(!checked)
      }}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        {
          minHeight: theme.size.touchTarget,
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          backgroundColor: pressed ? theme.color.pressedOverlay : 'transparent',
          borderRadius: theme.radius.sm,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.box,
          {
            width: box,
            height: box,
            borderRadius: theme.radius.sm,
            borderWidth: theme.size.focusRing.width,
            borderColor: disabled ? theme.color.disabledText : checked ? theme.color.primary : theme.color.borderStrong,
            backgroundColor: disabled ? theme.color.disabledBg : checked ? theme.color.primary : 'transparent',
          },
        ]}
      >
        {checked ? (
          <Check
            size={theme.size.icon.sm}
            color={disabled ? theme.color.disabledText : theme.color.onPrimary}
            strokeWidth={theme.size.focusRing.width}
          />
        ) : null}
      </View>
      <View style={[styles.text, { gap: theme.spacing.xxs }]}>
        <Text variant="body" color={disabled ? 'disabledText' : 'text'}>
          {label}
        </Text>
        {description ? (
          <Text variant="footnote" color={disabled ? 'disabledText' : 'textSecondary'}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  box: { alignItems: 'center', justifyContent: 'center', borderCurve: 'continuous' },
  text: { flex: 1 },
})
