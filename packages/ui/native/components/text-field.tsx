import { CircleAlert } from 'lucide-react-native'
import { forwardRef, useState, type ReactNode } from 'react'
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native'

import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

export type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor' | 'editable'> & {
  /** Always shown above the field; a placeholder is never the only label. Translated. */
  readonly label: string
  /** Help under the field. Replaced by `error` when there is one. Translated. */
  readonly hint?: string
  /** What is wrong and how to fix it. Translated. */
  readonly error?: string
  readonly disabled?: boolean
  /** Fixed text or an icon before the input, such as `+234` or `₦`. */
  readonly prefix?: ReactNode
  /** Something after the input, such as step buttons. */
  readonly suffix?: ReactNode
  readonly style?: StyleProp<ViewStyle>
}

/** A labelled text input with hint and error. The error is announced as soon as it appears. */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, hint, error, disabled = false, prefix, suffix, style, onFocus, onBlur, ...input },
  ref,
) {
  const theme = useTheme()
  const [focused, setFocused] = useState(false)
  const borderColor = error ? theme.color.danger : focused ? theme.color.primary : theme.color.borderStrong
  return (
    <View style={[{ gap: theme.spacing.xs }, style]}>
      <Text variant="subhead" color={disabled ? 'disabledText' : 'text'} importantForAccessibility="no">
        {label}
      </Text>
      <View
        style={[
          styles.box,
          {
            minHeight: theme.size.touchTarget,
            borderRadius: theme.radius.sm,
            borderWidth: focused || error ? theme.size.focusRing.width : 1,
            borderColor: disabled ? theme.color.border : borderColor,
            backgroundColor: disabled ? theme.color.disabledBg : theme.color.surfaceSunken,
            paddingHorizontal: theme.spacing.md,
            gap: theme.spacing.sm,
          },
        ]}
      >
        {prefix}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          accessibilityState={{ disabled }}
          editable={!disabled}
          placeholderTextColor={theme.color.textTertiary}
          selectionColor={theme.color.primary}
          cursorColor={theme.color.primary}
          onFocus={(event) => {
            setFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            onBlur?.(event)
          }}
          style={[
            styles.input,
            theme.text('body'),
            { color: disabled ? theme.color.disabledText : theme.color.text, paddingVertical: theme.spacing.sm },
          ]}
          {...input}
        />
        {suffix}
      </View>
      {error ? (
        <View
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          style={[styles.row, { gap: theme.spacing.xs }]}
        >
          <CircleAlert size={theme.size.icon.sm} color={theme.color.danger} strokeWidth={theme.size.iconStroke} />
          <Text variant="footnote" color="danger" style={styles.message}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="footnote" color="textSecondary" importantForAccessibility="no">
          {hint}
        </Text>
      ) : null}
    </View>
  )
})

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', borderCurve: 'continuous' },
  input: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  message: { flex: 1 },
})
