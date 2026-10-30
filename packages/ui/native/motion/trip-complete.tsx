// Expressive moment: trip complete (both apps). A check mark draws in a green disc (Skia, 500 ms),
// then the fare settles into place, leading into the rating. Under Reduce Motion the check is
// already drawn and everything fades in at once.

import { useTranslation } from '@collabo/i18n'
import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia'
import { useEffect, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated'

import { announce } from '../a11y/announce.ts'
import { MoneyText } from '../components/money-text.tsx'
import { Text } from '../components/text.tsx'
import { haptics } from '../haptics.ts'
import { useTheme } from '../theme/use-theme.ts'
import { easeOutCurve, enterUp } from './presets.ts'
import { useReduceMotion } from './use-reduce-motion.ts'

/** The check, on Lucide's 24 unit grid, parsed once. */
const checkPath = Skia.Path.MakeFromSVGString('M7 12.5l3.5 3.5L17 9')
const grid = 24

export type TripCompleteProps = {
  readonly fareKobo: number
  /** What follows: the rating, the receipt link. */
  readonly children?: ReactNode
  readonly style?: StyleProp<ViewStyle>
}

export function TripComplete({ fareKobo, children, style }: TripCompleteProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const reduced = useReduceMotion()
  const progress = useSharedValue(reduced ? 1 : 0)
  const path = checkPath
  const size = theme.size.avatar.xl

  useEffect(() => {
    haptics.success()
    announce(t('trip.complete'))
    if (!reduced) progress.set(withTiming(1, { duration: theme.duration.checkDraw, easing: easeOutCurve }))
  }, [progress, reduced, t, theme.duration.checkDraw])

  // The fare settles as the check finishes.
  const settleDelay = reduced ? 0 : theme.duration.checkDraw - theme.duration.base / 2

  return (
    <View style={[styles.wrap, { gap: theme.spacing.lg }, style]}>
      <View accessible={false} importantForAccessibility="no-hide-descendants">
        <Canvas style={{ width: size, height: size }}>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} color={theme.color.primary} />
          {path ? (
            <Group transform={[{ scale: size / grid }]}>
              <Path
                path={path}
                color={theme.color.onPrimary}
                style="stroke"
                strokeWidth={theme.size.focusRing.width}
                strokeCap="round"
                strokeJoin="round"
                start={0}
                end={progress}
              />
            </Group>
          ) : null}
        </Canvas>
      </View>
      <Animated.View entering={enterUp(reduced, settleDelay)} style={[styles.center, { gap: theme.spacing.xs }]}>
        <Text variant="title2" accessibilityRole="header">
          {t('trip.complete')}
        </Text>
        <MoneyText kobo={fareKobo} size="lg" />
      </Animated.View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  center: { alignItems: 'center' },
})
