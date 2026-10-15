import { Pressable, Switch as NativeSwitch, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

export type SwitchProps = {
  /** Translated. */
  readonly label: string
  /** A line explaining what the setting does. Translated. */
  readonly description?: string
  readonly value: boolean
  readonly onValueChange: (value: boolean) => void
  readonly disabled?: boolean
  readonly testID?: string
  readonly style?: StyleProp<ViewStyle>
}

/**
 * The platform switch in a labelled row. The whole row toggles it and is the one element a
 * screen reader lands on, so the label and state are read together.
 */
export function Switch({ label, description, value, onValueChange, disabled = false, testID, style }: SwitchProps) {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
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
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <NativeSwitch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: theme.color.borderStrong, true: theme.color.primary }}
          thumbColor={theme.color.surface}
          ios_backgroundColor={theme.color.borderStrong}
        />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { flex: 1 },
})
