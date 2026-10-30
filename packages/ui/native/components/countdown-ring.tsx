import { useTranslation } from '@collabo/i18n'
import { useEffect, useRef, useState } from 'react'
import { StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native'
import { createAnimatedComponent, Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'

import { announce, countdownAnnouncements } from '../a11y/announce.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

const AnimatedCircle = createAnimatedComponent(Circle)

/** Under this many seconds the ring and number turn to `danger`, and the label says so. */
const urgentSeconds = 10

export type CountdownRingProps = {
  /** When it runs out, as epoch milliseconds (an offer's or request's expiry). */
  readonly deadline: number
  /** The whole window, so the ring starts full. */
  readonly totalSeconds: number
  readonly onExpire?: () => void
  readonly style?: StyleProp<ViewStyle>
}

const secondsUntil = (deadline: number) => Math.max(0, Math.ceil((deadline - Date.now()) / 1000))

/**
 * Time left on an offer or request: a ring emptying linearly and the seconds in the middle.
 * Screen readers hear the time only at 30 and 10 seconds left, never every second.
 */
export function CountdownRing({ deadline, totalSeconds, onExpire, style }: CountdownRingProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const [left, setLeft] = useState(() => secondsUntil(deadline))
  const progress = useSharedValue(Math.min(1, left / totalSeconds))
  const expired = useRef(false)

  useEffect(() => {
    expired.current = false
    const remaining = Math.max(0, deadline - Date.now())
    progress.set(Math.min(1, remaining / (totalSeconds * 1000)))
    // Constant motion is linear; it runs on the UI thread whatever the JS thread is doing.
    progress.set(withTiming(0, { duration: remaining, easing: Easing.linear }))
    const timer = setInterval(() => setLeft(secondsUntil(deadline)), 250)
    return () => clearInterval(timer)
  }, [deadline, totalSeconds, progress])

  useEffect(() => {
    if ((countdownAnnouncements as readonly number[]).includes(left)) {
      announce(t('countdown.secondsLeft', { seconds: left }))
    }
    if (left === 0 && !expired.current) {
      expired.current = true
      onExpire?.()
    }
  }, [left, onExpire, t])

  // The ring grows with the text size, so the number never needs a cap.
  const { fontScale } = useWindowDimensions()
  const size = theme.size.avatar.lg * Math.max(1, fontScale * theme.textScale * 0.75)
  const stroke = theme.spacing.xs
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.get()) }))
  const urgent = left <= urgentSeconds
  const ringColor = urgent ? theme.color.danger : theme.color.primary

  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={t('countdown.secondsLeft', { seconds: left })}
      style={[styles.wrap, { width: size, height: size }, style]}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.color.border} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={ringProps}
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text variant="headline" color={urgent ? 'danger' : 'text'} style={styles.tabular}>
        {left}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  tabular: { fontVariant: ['tabular-nums'] },
})
