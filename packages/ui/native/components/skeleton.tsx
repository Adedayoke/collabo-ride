import { useTranslation } from '@collabo/i18n'
import type { ReactNode } from 'react'
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

import type { RadiusToken } from '../../tokens/index.ts'
import { useReduceMotion } from '../motion/use-reduce-motion.ts'
import { useTheme } from '../theme/use-theme.ts'

export type SkeletonProps = {
  readonly width?: DimensionValue
  readonly height: number
  readonly radius?: RadiusToken
  readonly style?: StyleProp<ViewStyle>
}

/**
 * A loading placeholder in the shape of the content to come. It pulses between the two
 * skeleton tokens; with Reduce Motion it holds still. Screen readers hear "Loading" once,
 * from the group (`SkeletonGroup`), not from every block.
 */
export function Skeleton({ width = '100%', height, radius = 'sm', style }: SkeletonProps) {
  const theme = useTheme()
  const reduced = useReduceMotion()
  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: theme.radius[radius],
          backgroundColor: theme.color.skeleton,
        },
        reduced
          ? null
          : {
              animationName: {
                '0%': { backgroundColor: theme.color.skeleton },
                '50%': { backgroundColor: theme.color.skeletonHighlight },
                '100%': { backgroundColor: theme.color.skeleton },
              },
              animationDuration: theme.duration.skeletonPulse,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
            },
        style,
      ]}
    />
  )
}

export type SkeletonGroupProps = {
  readonly children: ReactNode
  readonly style?: StyleProp<ViewStyle>
}

/** Wraps a set of skeletons so assistive tech hears one busy "Loading" region. */
export function SkeletonGroup({ children, style }: SkeletonGroupProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  return (
    <View
      accessible
      accessibilityLabel={t('state.loading')}
      accessibilityState={{ busy: true }}
      style={[{ gap: theme.spacing.sm }, style]}
    >
      {children}
    </View>
  )
}
