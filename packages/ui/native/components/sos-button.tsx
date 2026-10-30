import { useTranslation } from '@collabo/i18n'
import { useState } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { haptics } from '../haptics.ts'
import { SosMark } from '../icons/index.tsx'
import { useReduceMotion } from '../motion/use-reduce-motion.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'

export type SosButtonProps = {
  /** Fires after a one second hold, never on a tap. */
  readonly onConfirm: () => void
  readonly style?: StyleProp<ViewStyle>
}

/**
 * Always visible on trip screens. Press and hold for a second: a fill sweeps across while the
 * label says "Keep holding", then a heavy haptic and `onConfirm`. Letting go early cancels.
 * Screen reader users get a named "Emergency SOS" action instead of the hold.
 */
export function SosButton({ onConfirm, style }: SosButtonProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const reduced = useReduceMotion()
  const [holding, setHolding] = useState(false)
  const fill = useSharedValue(0)
  // Absolutely placed and childless, so animating its width re-lays out nothing else.
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.get() * 100}%` }))

  const confirm = () => {
    haptics.heavy()
    setHolding(false)
    fill.set(0)
    onConfirm()
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('sos.label')}
      accessibilityHint={t('sos.hint')}
      accessibilityActions={[{ name: 'longpress', label: t('sos.label') }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'longpress') confirm()
      }}
      delayLongPress={theme.duration.sosHold}
      onPressIn={() => {
        setHolding(true)
        if (!reduced) fill.set(withTiming(1, { duration: theme.duration.sosHold, easing: Easing.linear }))
      }}
      onPressOut={() => {
        setHolding(false)
        fill.set(withTiming(0, { duration: theme.duration.fast }))
      }}
      onLongPress={confirm}
      style={[
        styles.button,
        {
          minHeight: theme.size.button.lg,
          paddingHorizontal: theme.spacing.xl,
          gap: theme.spacing.sm,
          borderRadius: theme.radius.full,
          backgroundColor: theme.color.danger,
          boxShadow: theme.elevation.raised,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.fill, { backgroundColor: theme.color.pressedOverlay }, fillStyle]}
      />
      <SosMark size={theme.size.icon.lg} color={theme.color.onDanger} />
      <View>
        <Text variant="headline" style={{ color: theme.color.onDanger }}>
          {holding ? t('sos.holding') : t('sos.label')}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fill: { position: 'absolute', top: 0, bottom: 0, start: 0 },
})
