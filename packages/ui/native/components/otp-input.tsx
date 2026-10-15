import { useTranslation } from '@collabo/i18n'
import { CircleAlert } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Platform, Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated'

import { haptics } from '../haptics.ts'
import { useReduceMotion } from '../motion/use-reduce-motion.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

export const otpLength = 6

export type OtpInputProps = {
  readonly value: string
  readonly onChange: (code: string) => void
  /** Called once all six digits are in. */
  readonly onComplete?: (code: string) => void
  /** The number the code went to, already formatted for display. */
  readonly phoneDisplay: string
  /** A wrong or expired code. Translated. */
  readonly error?: string
  /** When "Resend code" becomes available, as epoch milliseconds (from the send response). */
  readonly resendAvailableAt?: number
  readonly onResend?: () => void
  /** Open the keyboard as soon as the step appears, as the code is the only thing to do here. */
  readonly focusOnMount?: boolean
  readonly style?: StyleProp<ViewStyle>
}

/** Whole seconds until `deadline`, ticking while there is time left. */
function useSecondsUntil(deadline: number): number {
  const [now, setNow] = useState(() => Date.now())
  const left = Math.max(0, Math.ceil((deadline - now) / 1000))
  useEffect(() => {
    if (left <= 0) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [left])
  return left
}

/**
 * One hidden text input drawn as six cells, so screen readers and paste see a single field and
 * the platform can fill the code from the SMS. A wrong code shakes the cells; with Reduce Motion
 * it changes color and shows the message only.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  phoneDisplay,
  error,
  resendAvailableAt = 0,
  onResend,
  focusOnMount = true,
  style,
}: OtpInputProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const reduced = useReduceMotion()
  const input = useRef<TextInput>(null)
  const [focused, setFocused] = useState(false)
  const shake = useSharedValue(0)
  const resendIn = useSecondsUntil(resendAvailableAt)

  useEffect(() => {
    if (focusOnMount) input.current?.focus()
  }, [focusOnMount])

  useEffect(() => {
    if (!error) return
    haptics.error()
    if (reduced) return
    const step = theme.spacing.sm
    const beat = theme.duration.fast / 3
    shake.set(
      withSequence(
        withTiming(-step, { duration: beat }),
        withTiming(step, { duration: beat }),
        withTiming(-step / 2, { duration: beat }),
        withTiming(0, { duration: beat }),
      ),
    )
  }, [error, reduced, shake, theme])

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }))
  const digits = value.split('')
  const active = Math.min(value.length, otpLength - 1)

  return (
    <View style={[{ gap: theme.spacing.md }, style]}>
      <View>
        <Animated.View
          importantForAccessibility="no-hide-descendants"
          style={[styles.cells, { gap: theme.spacing.sm }, shakeStyle]}
        >
          {Array.from({ length: otpLength }, (_, index) => {
            const isActive = focused && index === active
            return (
              <View
                key={index}
                style={[
                  styles.cell,
                  {
                    minWidth: theme.size.touchTarget - theme.spacing.xs,
                    minHeight: theme.size.button.lg,
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.color.surfaceSunken,
                    borderWidth: isActive || error ? theme.size.focusRing.width : 1,
                    borderColor: error ? theme.color.danger : isActive ? theme.color.primary : theme.color.borderStrong,
                  },
                ]}
              >
                <Text variant="title2" style={styles.digit}>
                  {digits[index] ?? ''}
                </Text>
              </View>
            )
          })}
        </Animated.View>
        {/* Laid over the cells, so taps focus it and a screen reader's focus box matches them. */}
        <TextInput
          ref={input}
          value={value}
          onChangeText={(text) => {
            const code = text.replace(/\D/g, '').slice(0, otpLength)
            onChange(code)
            if (code.length === otpLength) onComplete?.(code)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          maxLength={otpLength}
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
          accessibilityLabel={t('field.otp')}
          accessibilityHint={error ?? t('field.otpHint', { phone: phoneDisplay })}
          caretHidden
          style={[StyleSheet.absoluteFill, styles.hiddenInput]}
        />
      </View>

      {error ? (
        <View
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          style={[styles.row, { gap: theme.spacing.xs }]}
        >
          <CircleAlert size={theme.size.icon.sm} color={theme.color.danger} strokeWidth={theme.size.iconStroke} />
          <Text variant="footnote" color="danger" style={styles.flex}>
            {error}
          </Text>
        </View>
      ) : (
        <Text variant="footnote" color="textSecondary" importantForAccessibility="no">
          {t('field.otpHint', { phone: phoneDisplay })}
        </Text>
      )}

      {onResend ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={resendIn > 0 ? t('action.resendIn', { seconds: resendIn }) : t('action.resend')}
          accessibilityState={{ disabled: resendIn > 0 }}
          disabled={resendIn > 0}
          onPress={onResend}
          style={({ pressed }) => [
            styles.resend,
            { minHeight: theme.size.touchTarget, opacity: pressed ? theme.opacity.pressed : 1 },
          ]}
        >
          <Text variant="headline" color={resendIn > 0 ? 'textSecondary' : 'primary'}>
            {resendIn > 0 ? t('action.resendIn', { seconds: resendIn }) : t('action.resend')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  cells: { flexDirection: 'row', justifyContent: 'center' },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', borderCurve: 'continuous' },
  digit: { fontVariant: ['tabular-nums'] },
  // Present for the keyboard, autofill, and screen readers; the cells draw what it holds.
  hiddenInput: { color: 'transparent', backgroundColor: 'transparent' },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  resend: { alignSelf: 'flex-start', justifyContent: 'center' },
})
