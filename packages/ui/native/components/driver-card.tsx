import { formatRating, formatShortName, useTranslation } from '@collabo/i18n'
import type { ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

import { fadeIn, riseIn } from '../motion/presets.ts'
import { useReduceMotion } from '../motion/use-reduce-motion.ts'
import { useLocale } from '../theme/use-locale.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Avatar } from './avatar.tsx'
import { RatingStars } from './rating-stars.tsx'
import { Text } from './text.tsx'

export type DriverSummary = {
  readonly fullName: string
  readonly photoUri?: string | null
  readonly rating: number
  /** Make, model, and colour as one line: "Toyota Corolla · Silver". */
  readonly car: string
  /** As stored, upper case. */
  readonly plate: string
}

export type DriverCardProps = {
  readonly driver: DriverSummary
  /**
   * The "driver found" moment: the card rises with `springGentle`, then the photo and the plate
   * fade in one after another. Under Reduce Motion it is a short fade.
   */
  readonly animateIn?: boolean
  /** Actions under the summary: call, message, share trip. */
  readonly children?: ReactNode
  readonly style?: StyleProp<ViewStyle>
}

/** Who is coming: photo, "Tunde A.", rating, car, and the plate in a number plate badge. */
export function DriverCard({ driver, animateIn = false, children, style }: DriverCardProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const locale = useLocale()
  const reduced = useReduceMotion()
  const name = formatShortName(driver.fullName)
  const stagger = theme.duration.stagger

  return (
    <Animated.View
      entering={animateIn ? riseIn(reduced) : undefined}
      style={[
        styles.card,
        {
          backgroundColor: theme.color.surface,
          borderColor: theme.color.border,
          borderWidth: theme.mode === 'light' ? StyleSheet.hairlineWidth : 0,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          gap: theme.spacing.lg,
          boxShadow: theme.elevation.card,
        },
        style,
      ]}
    >
      <View
        accessible
        accessibilityLabel={t('driver.label', {
          name,
          rating: formatRating(driver.rating, locale),
          car: driver.car,
          plate: driver.plate.split('').join(' '),
        })}
        style={[styles.row, { gap: theme.spacing.md }]}
      >
        <Animated.View entering={animateIn ? fadeIn(reduced, stagger * 2) : undefined}>
          <Avatar name={driver.fullName} photoUri={driver.photoUri} size="lg" decorative />
        </Animated.View>
        <View style={[styles.text, { gap: theme.spacing.xxs }]}>
          <Text variant="title3">{name}</Text>
          <RatingStars mode="display" value={driver.rating} />
          <Text variant="subhead" color="textSecondary">
            {driver.car}
          </Text>
        </View>
        <Animated.View
          entering={animateIn ? fadeIn(reduced, stagger * 3) : undefined}
          style={[
            styles.plate,
            {
              borderRadius: theme.radius.sm,
              borderWidth: theme.size.focusRing.width,
              borderColor: theme.color.text,
              backgroundColor: theme.color.surfaceSunken,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
            },
          ]}
        >
          <Text variant="headline" style={styles.plateText}>
            {driver.plate}
          </Text>
        </Animated.View>
      </View>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: { borderCurve: 'continuous' },
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { flex: 1 },
  plate: { borderCurve: 'continuous' },
  plateText: { letterSpacing: 1, fontVariant: ['tabular-nums'] },
})
